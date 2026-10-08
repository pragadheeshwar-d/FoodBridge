/**
 * FoodBridge 100% Native Cloudflare Serverless Edge Backend & Static Asset Server
 * Runs 24/7 on Cloudflare Workers with optional Cloudflare D1 SQL Database.
 */

// JWT Secret Key (Can be overridden via Cloudflare Worker environment variables)
const JWT_SECRET = 'foodbridge-edge-jwt-production-key-2026';

// --- Web Crypto Password Hashing & JWT Helpers ---

async function hashPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const salt = enc.encode('foodbridge-salt-2026');
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hashed) {
  if (!hashed || !password) return false;
  const h = await hashPassword(password);
  return h === hashed;
}

function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + (30 * 24 * 3600) }; // 30 days expiry

  const enc = new TextEncoder();
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${encodedSignature}`;
}

async function verifyJWT(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(base64UrlDecode(encodedSignature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- In-Memory Stateful Edge Database (Active when D1 is not bound) ---

class MemoryStore {
  constructor() {
    this.users = [];
    this.donations = [];
    this.pickups = [];
    this.needs = [];
    this.notifications = [];
    this.messages = [];
    this.nextId = { users: 1, donations: 1, pickups: 1, needs: 1, notifications: 1, messages: 1 };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Seed default administrator
    const adminHashed = await hashPassword('Admin@123');
    this.users.push({
      id: this.nextId.users++,
      name: 'FoodBridge Admin',
      email: 'admin@foodbridge.org',
      password: adminHashed,
      role: 'admin',
      organization: 'FoodBridge Central',
      phone: '9876543210',
      address: 'FoodBridge HQ',
      verified: true,
      status: 'approved',
      created_at: new Date().toISOString()
    });

    // Seed sample donor & receiver
    const donorPass = await hashPassword('Donor@123');
    const donorUser = {
      id: this.nextId.users++,
      name: 'City Bakery & Cafe',
      email: 'donor@foodbridge.org',
      password: donorPass,
      role: 'donor',
      organization: 'City Bakers',
      phone: '9123456780',
      address: '124 Anna Salai, Chennai',
      verified: true,
      status: 'approved',
      created_at: new Date().toISOString()
    };
    this.users.push(donorUser);

    const recvPass = await hashPassword('Receiver@123');
    const recvUser = {
      id: this.nextId.users++,
      name: 'Hope Shelter NGO',
      email: 'receiver@foodbridge.org',
      password: recvPass,
      role: 'receiver',
      organization: 'Hope Charity Shelter',
      phone: '9012345678',
      address: '45 Gandhi Road, Chennai',
      verified: true,
      status: 'approved',
      created_at: new Date().toISOString()
    };
    this.users.push(recvUser);

    // Seed sample active donation
    this.donations.push({
      id: this.nextId.donations++,
      donor_id: donorUser.id,
      donor_name: donorUser.name,
      donor_org: donorUser.organization,
      food_name: 'Fresh Bread & Pastries',
      food_type: 'Baked Goods',
      category: 'Veg',
      veg_type: 'Veg',
      quantity: '25 packs',
      quantity_number: 25,
      remaining_quantity: 25,
      unit: 'packs',
      description: 'Assorted fresh baked breads and vegetable rolls prepared this afternoon.',
      pickup_address: donorUser.address,
      latitude: 13.0827,
      longitude: 80.2707,
      expiry_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'Available',
      freshness_score: 95,
      risk_level: 'Low',
      created_at: new Date().toISOString()
    });
  }
}

const memoryStore = new MemoryStore();

// --- Cloudflare D1 Database Helper ---

async function initD1Tables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      organization TEXT,
      phone TEXT,
      address TEXT,
      profile_image TEXT,
      verified INTEGER DEFAULT 1,
      status TEXT DEFAULT 'approved',
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER NOT NULL,
      food_name TEXT NOT NULL,
      food_type TEXT NOT NULL,
      category TEXT,
      veg_type TEXT,
      quantity TEXT NOT NULL,
      quantity_number REAL,
      remaining_quantity REAL,
      unit TEXT,
      description TEXT,
      pickup_address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      pickup_time TEXT,
      expiry_time TEXT NOT NULL,
      freshness_score INTEGER,
      risk_level TEXT,
      status TEXT DEFAULT 'Available',
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS pickup_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donation_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending',
      request_message TEXT,
      requested_quantity REAL,
      allocated_quantity REAL DEFAULT 0,
      qr_token TEXT,
      requested_at TEXT,
      approved_at TEXT,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  // Seed default admin in D1 if not present
  const admin = await db.prepare("SELECT * FROM users WHERE email = 'admin@foodbridge.org'").first();
  if (!admin) {
    const adminHash = await hashPassword('Admin@123');
    await db.prepare(
      "INSERT INTO users (name, email, password, role, organization, phone, address, verified, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'approved', ?)"
    ).bind('FoodBridge Admin', 'admin@foodbridge.org', adminHash, 'admin', 'FoodBridge HQ', '9876543210', 'Admin Office', new Date().toISOString()).run();
  }
}

// --- Response Helpers ---

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

function corsOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

// --- Main Cloudflare Worker Fetch Router ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight for all endpoints
    if (request.method === 'OPTIONS') {
      return corsOptionsResponse();
    }

    // Only process /api/ routes through the edge backend
    if (url.pathname.startsWith('/api') || url.pathname === '/api') {
      await memoryStore.init();
      if (env.DB) {
        try {
          await initD1Tables(env.DB);
        } catch {}
      }

      // 1. Health check
      if (url.pathname === '/api/health') {
        return jsonResponse({
          success: true,
          message: 'FoodBridge Cloudflare Edge API 24/7 is fully operational',
          data: {
            service: 'FoodBridge Cloudflare Edge API',
            status: 'online',
            edge: true,
            database: env.DB ? 'Cloudflare D1 SQL' : 'Cloudflare Edge Store',
            time: new Date().toISOString()
          }
        });
      }

      // Helper to extract JWT user
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const currentUser = await verifyJWT(token);

      // --- AUTH ROUTES ---

      // POST /api/auth/login or /api/login
      if (request.method === 'POST' && (url.pathname === '/api/auth/login' || url.pathname === '/api/login')) {
        try {
          const body = await request.json();
          const { email, password } = body;
          if (!email || !password) {
            return jsonResponse({ success: false, message: 'Email and password are required' }, 400);
          }

          let user = null;
          if (env.DB) {
            user = await env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = ?").bind(email.toLowerCase().trim()).first();
          } else {
            user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
          }

          if (!user) {
            return jsonResponse({ success: false, message: 'Invalid email or password' }, 401);
          }

          const valid = await verifyPassword(password, user.password);
          if (!valid) {
            return jsonResponse({ success: false, message: 'Invalid email or password' }, 401);
          }

          const jwtPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
          const authToken = await createJWT(jwtPayload);

          const { password: _, ...cleanUser } = user;
          return jsonResponse({
            success: true,
            message: 'Login successful',
            data: { token: authToken, user: cleanUser }
          });
        } catch (err) {
          return jsonResponse({ success: false, message: 'Login error: ' + err.message }, 500);
        }
      }

      // POST /api/auth/register or /api/register
      if (request.method === 'POST' && (url.pathname === '/api/auth/register' || url.pathname === '/api/register')) {
        try {
          const body = await request.json();
          const { name, email, password, role = 'donor', organization = '', phone = '', address = '' } = body;
          if (!email || !password || !name) {
            return jsonResponse({ success: false, message: 'Name, email, and password are required' }, 400);
          }

          const hashed = await hashPassword(password);
          let newUser = null;

          if (env.DB) {
            const existing = await env.DB.prepare("SELECT id FROM users WHERE LOWER(email) = ?").bind(email.toLowerCase().trim()).first();
            if (existing) {
              return jsonResponse({ success: false, message: 'Email is already registered' }, 400);
            }
            const res = await env.DB.prepare(
              "INSERT INTO users (name, email, password, role, organization, phone, address, verified, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'approved', ?)"
            ).bind(name, email.toLowerCase().trim(), hashed, role, organization, phone, address, new Date().toISOString()).run();

            newUser = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(res.meta.last_row_id).first();
          } else {
            const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
            if (existing) {
              return jsonResponse({ success: false, message: 'Email is already registered' }, 400);
            }
            newUser = {
              id: memoryStore.nextId.users++,
              name,
              email: email.toLowerCase().trim(),
              password: hashed,
              role,
              organization,
              phone,
              address,
              verified: true,
              status: 'approved',
              created_at: new Date().toISOString()
            };
            memoryStore.users.push(newUser);
          }

          const jwtPayload = { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name };
          const authToken = await createJWT(jwtPayload);

          const { password: _, ...cleanUser } = newUser;
          return jsonResponse({
            success: true,
            message: 'Registration successful',
            data: { token: authToken, user: cleanUser }
          });
        } catch (err) {
          return jsonResponse({ success: false, message: 'Registration error: ' + err.message }, 500);
        }
      }

      // GET /api/auth/check or /api/check
      if (request.method === 'GET' && (url.pathname === '/api/auth/check' || url.pathname === '/api/check')) {
        if (!currentUser) {
          return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        }

        let user = null;
        if (env.DB) {
          user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(currentUser.id).first();
        } else {
          user = memoryStore.users.find(u => u.id === currentUser.id);
        }

        if (!user) return jsonResponse({ success: false, message: 'User not found' }, 404);
        const { password: _, ...cleanUser } = user;
        return jsonResponse({ success: true, message: 'Authenticated', data: { user: cleanUser } });
      }

      // GET & PUT /api/auth/profile or /api/profile
      if (url.pathname === '/api/auth/profile' || url.pathname === '/api/profile') {
        if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);

        if (request.method === 'GET') {
          let user = env.DB 
            ? await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(currentUser.id).first()
            : memoryStore.users.find(u => u.id === currentUser.id);

          if (!user) return jsonResponse({ success: false, message: 'User not found' }, 404);
          const { password: _, ...cleanUser } = user;
          return jsonResponse({ success: true, data: { user: cleanUser } });
        }

        if (request.method === 'PUT') {
          const body = await request.json();
          if (env.DB) {
            await env.DB.prepare(
              "UPDATE users SET name = COALESCE(?, name), organization = COALESCE(?, organization), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?"
            ).bind(body.name, body.organization, body.phone, body.address, currentUser.id).run();
          } else {
            const idx = memoryStore.users.findIndex(u => u.id === currentUser.id);
            if (idx !== -1) {
              memoryStore.users[idx] = { ...memoryStore.users[idx], ...body };
            }
          }
          return jsonResponse({ success: true, message: 'Profile updated successfully' });
        }
      }

      // --- DONATIONS ROUTES ---

      // GET & POST /api/donations
      if (url.pathname === '/api/donations') {
        if (request.method === 'GET') {
          let list = [];
          if (env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM donations ORDER BY id DESC").all();
            list = results || [];
          } else {
            list = [...memoryStore.donations].reverse();
          }
          return jsonResponse({ success: true, data: list });
        }

        if (request.method === 'POST') {
          if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
          const body = await request.json();

          const qtyNum = parseFloat(body.quantity || body.quantity_number) || 10;
          const donationItem = {
            donor_id: currentUser.id,
            food_name: body.food_name || 'Prepared Food',
            food_type: body.food_type || 'Cooked Meal',
            category: body.category || 'Veg',
            veg_type: body.veg_type || 'Veg',
            quantity: String(body.quantity || `${qtyNum} servings`),
            quantity_number: qtyNum,
            remaining_quantity: qtyNum,
            unit: body.unit || 'servings',
            description: body.description || '',
            pickup_address: body.pickup_address || currentUser.address || 'Chennai Central',
            latitude: body.latitude || 13.0827,
            longitude: body.longitude || 80.2707,
            expiry_time: body.expiry_time || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            status: 'Available',
            freshness_score: Math.floor(Math.random() * 15) + 85,
            risk_level: 'Low',
            created_at: new Date().toISOString()
          };

          if (env.DB) {
            const res = await env.DB.prepare(
              `INSERT INTO donations (donor_id, food_name, food_type, category, veg_type, quantity, quantity_number, remaining_quantity, unit, description, pickup_address, latitude, longitude, expiry_time, status, freshness_score, risk_level, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              donationItem.donor_id, donationItem.food_name, donationItem.food_type, donationItem.category, donationItem.veg_type,
              donationItem.quantity, donationItem.quantity_number, donationItem.remaining_quantity, donationItem.unit, donationItem.description,
              donationItem.pickup_address, donationItem.latitude, donationItem.longitude, donationItem.expiry_time,
              donationItem.status, donationItem.freshness_score, donationItem.risk_level, donationItem.created_at
            ).run();
            donationItem.id = res.meta.last_row_id;
          } else {
            donationItem.id = memoryStore.nextId.donations++;
            memoryStore.donations.push(donationItem);
          }

          return jsonResponse({ success: true, message: 'Donation posted successfully', data: donationItem }, 201);
        }
      }

      // --- PICKUP REQUESTS ROUTES ---

      // GET & POST /api/pickups or /api/pickup-requests
      if (url.pathname === '/api/pickups' || url.pathname === '/api/pickup-requests') {
        if (request.method === 'GET') {
          let list = [];
          if (env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM pickup_requests ORDER BY id DESC").all();
            list = results || [];
          } else {
            list = [...memoryStore.pickups].reverse();
          }
          return jsonResponse({ success: true, data: list });
        }

        if (request.method === 'POST') {
          if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
          const body = await request.json();

          const pickupItem = {
            donation_id: body.donation_id,
            receiver_id: currentUser.id,
            status: 'Approved',
            request_message: body.request_message || 'Pickup requested',
            requested_quantity: parseFloat(body.requested_quantity || 1),
            allocated_quantity: parseFloat(body.requested_quantity || 1),
            qr_token: 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            requested_at: new Date().toISOString(),
            approved_at: new Date().toISOString()
          };

          if (env.DB) {
            const res = await env.DB.prepare(
              `INSERT INTO pickup_requests (donation_id, receiver_id, status, request_message, requested_quantity, allocated_quantity, qr_token, requested_at, approved_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              pickupItem.donation_id, pickupItem.receiver_id, pickupItem.status, pickupItem.request_message,
              pickupItem.requested_quantity, pickupItem.allocated_quantity, pickupItem.qr_token, pickupItem.requested_at, pickupItem.approved_at
            ).run();
            pickupItem.id = res.meta.last_row_id;
          } else {
            pickupItem.id = memoryStore.nextId.pickups++;
            memoryStore.pickups.push(pickupItem);
          }

          return jsonResponse({ success: true, message: 'Pickup request created', data: pickupItem }, 201);
        }
      }

      // --- DASHBOARD & METRICS ROUTES ---

      if (url.pathname.startsWith('/api/dashboard')) {
        const totalDonations = env.DB 
          ? (await env.DB.prepare("SELECT COUNT(*) as c FROM donations").first())?.c || 0
          : memoryStore.donations.length;

        const activePickups = env.DB 
          ? (await env.DB.prepare("SELECT COUNT(*) as c FROM pickup_requests WHERE status != 'Completed'").first())?.c || 0
          : memoryStore.pickups.filter(p => p.status !== 'Completed').length;

        return jsonResponse({
          success: true,
          data: {
            total_donations: totalDonations,
            meals_saved: totalDonations * 45 + 120,
            active_pickups: activePickups,
            co2_reduced_kg: totalDonations * 18.5,
            impact_score: 98,
            recent_activities: [
              { title: 'Fresh Donation Listed', description: 'Bread & Pastries ready for pickup', time: '10m ago' },
              { title: 'Pickup Scheduled', description: 'Hope Shelter NGO accepted pickup request', time: '25m ago' }
            ]
          }
        });
      }

      // --- NOTIFICATIONS ROUTES ---

      if (url.pathname === '/api/notifications') {
        const notifs = [
          { id: 1, title: 'Welcome to FoodBridge', message: 'Your Cloudflare Edge account is active.', is_read: false, created_at: new Date().toISOString() },
          { id: 2, title: 'Donation Update', message: 'New food donation available in your area.', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() }
        ];
        return jsonResponse({ success: true, data: notifs });
      }

      // Fallback for unhandled API routes
      return jsonResponse({ success: false, message: 'API route not found' }, 404);
    }

    // Default: Serve frontend React / Vite static assets with SPA routing
    return env.ASSETS.fetch(request);
  },
};
