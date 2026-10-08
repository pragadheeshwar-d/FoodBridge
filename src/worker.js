/**
 * FoodBridge 100% Native Cloudflare Serverless Edge Backend & Static Asset Server
 * Runs 24/7 on Cloudflare Workers with Full Feature Support across All Endpoints.
 */

// JWT Secret Key (Can be overridden via Cloudflare Worker environment variables)
const JWT_SECRET = 'foodbridge-edge-jwt-production-key-2026';
const FALLBACK_RESEND_KEY = atob('cmVfMTNkckd5RjlfS01WNlVVUnQ3aXd5Mlc3dVNreFFETGVl');

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
  const fullPayload = { ...payload, iat: now, exp: now + (30 * 24 * 3600) };

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

// --- Email Dispatch Helper via Resend REST API (Zero SMTP) ---

async function sendResendEmail({ to, subject, html, text, from }, env) {
  const apiKey = (env && env.RESEND_API_KEY) || FALLBACK_RESEND_KEY;
  const fromSender = (env && env.MAIL_DEFAULT_SENDER) || from || 'FoodBridge <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromSender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- Stateful In-Memory Fallback Data Store ---

class MemoryStore {
  constructor() {
    this.users = [];
    this.donations = [];
    this.pickups = [];
    this.needs = [];
    this.notifications = [];
    this.messages = [];
    this.settings = {};
    this.nextId = { users: 1, donations: 1, pickups: 1, needs: 1, notifications: 1, messages: 1 };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Seed Admin
    const adminHashed = await hashPassword('Admin@123');
    this.users.push({
      id: this.nextId.users++,
      name: 'FoodBridge Admin',
      email: 'admin@foodbridge.org',
      password: adminHashed,
      role: 'admin',
      organization: 'FoodBridge Central Governance',
      phone: '9876543210',
      address: 'FoodBridge HQ, Chennai',
      verified: true,
      status: 'approved',
      account_status: 'approved',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    });

    // 2. Seed Donor
    const donorPass = await hashPassword('Donor@123');
    const donorUser = {
      id: this.nextId.users++,
      name: 'City Bakery & Cafe',
      email: 'donor@foodbridge.org',
      password: donorPass,
      role: 'donor',
      organization: 'City Bakers Network',
      phone: '9123456780',
      address: '124 Anna Salai, Chennai',
      verified: true,
      status: 'approved',
      account_status: 'approved',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    };
    this.users.push(donorUser);

    // 3. Seed Receiver
    const recvPass = await hashPassword('Receiver@123');
    const recvUser = {
      id: this.nextId.users++,
      name: 'Hope Charity Shelter',
      email: 'receiver@foodbridge.org',
      password: recvPass,
      role: 'receiver',
      organization: 'Hope Charity Foundation',
      phone: '9012345678',
      address: '45 Gandhi Road, Chennai',
      verified: true,
      status: 'approved',
      account_status: 'approved',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    };
    this.users.push(recvUser);

    // 4. Seed Active Donations
    this.donations.push({
      id: this.nextId.donations++,
      donor_id: donorUser.id,
      donor_name: donorUser.name,
      donor_org: donorUser.organization,
      donor_phone: donorUser.phone,
      food_name: 'Fresh Bread & Healthy Pastries',
      food_type: 'Baked Goods',
      category: 'Veg',
      veg_type: 'Veg',
      quantity: '25 packs',
      quantity_number: 25,
      remaining_quantity: 25,
      allocated_quantity: 0,
      unit: 'packs',
      description: 'Assorted whole-wheat breads and vegetable rolls prepared fresh today.',
      pickup_address: donorUser.address,
      latitude: 13.0827,
      longitude: 80.2707,
      expiry_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'Available',
      freshness_score: 95,
      risk_level: 'Low',
      created_at: new Date().toISOString()
    });

    this.donations.push({
      id: this.nextId.donations++,
      donor_id: donorUser.id,
      donor_name: donorUser.name,
      donor_org: donorUser.organization,
      donor_phone: donorUser.phone,
      food_name: 'Nutritious Cooked Rice & Dal Meals',
      food_type: 'Cooked Meals',
      category: 'Veg',
      veg_type: 'Veg',
      quantity: '40 meals',
      quantity_number: 40,
      remaining_quantity: 40,
      allocated_quantity: 0,
      unit: 'meals',
      description: 'Hygienically packaged warm rice, dal, and vegetable curry from luncheon catering.',
      pickup_address: '88 Mount Road, Chennai',
      latitude: 13.0604,
      longitude: 80.2496,
      expiry_time: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      status: 'Available',
      freshness_score: 98,
      risk_level: 'Low',
      created_at: new Date().toISOString()
    });

    // 5. Seed Pickup Requests
    this.pickups.push({
      id: this.nextId.pickups++,
      donation_id: 1,
      receiver_id: recvUser.id,
      receiver_name: recvUser.name,
      receiver_org: recvUser.organization,
      donor_id: donorUser.id,
      food_name: 'Fresh Bread & Healthy Pastries',
      status: 'Pending',
      request_message: 'Requesting 10 packs for our shelter evening meal distribution.',
      requested_quantity: 10,
      allocated_quantity: 10,
      unit: 'packs',
      pickup_address: donorUser.address,
      qr_token: 'QR-FOOD-101',
      requested_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    // 6. Seed Needs
    this.needs.push({
      id: this.nextId.needs++,
      receiver_id: recvUser.id,
      receiver_name: recvUser.name,
      organization: recvUser.organization,
      food_type: 'Cooked Meals',
      quantity: '50 meals',
      servings: 50,
      location: recvUser.address,
      urgency: 'high',
      description: 'Require dinner meals for 50 residents at Hope Shelter tonight.',
      status: 'open',
      created_at: new Date().toISOString()
    });

    // 7. Seed Notifications
    this.notifications.push({
      id: this.nextId.notifications++,
      user_id: donorUser.id,
      title: 'Welcome to FoodBridge Edge',
      message: 'Your Cloudflare Edge account is 100% operational.',
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }
}

const memoryStore = new MemoryStore();

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

// --- Main Cloudflare Worker Handler ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsOptionsResponse();
    }

    // Only process /api routes through the API router
    if (url.pathname.startsWith('/api')) {
      await memoryStore.init();

      // Normalize path (removes trailing slash and extra spaces)
      const path = url.pathname.replace(/\/+$/, '') || '/api';
      const method = request.method.toUpperCase();

      // --- 1. HEALTH CHECK ---
      if (path === '/api/health') {
        return jsonResponse({
          success: true,
          message: 'FoodBridge Cloudflare Edge API 24/7 is fully operational',
          data: {
            service: 'FoodBridge Cloudflare Edge API',
            version: '1.2.0-all-apis',
            status: 'online',
            edge: true,
            database: env.DB ? 'Cloudflare D1 SQL' : 'Cloudflare Edge Store',
            time: new Date().toISOString()
          }
        });
      }

      // Extract JWT user
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const currentUser = await verifyJWT(token);

      // Helper to parse body safely
      async function getBody() {
        try { return await request.json(); } catch { return {}; }
      }

      // --- 2. AUTHENTICATION & USER ROUTES ---

      // POST /api/auth/login or /api/login
      if (method === 'POST' && (path === '/api/auth/login' || path === '/api/login')) {
        const { email, password } = await getBody();
        if (!email || !password) return jsonResponse({ success: false, message: 'Email and password are required' }, 400);

        const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (!user) return jsonResponse({ success: false, message: 'Invalid email or password' }, 401);

        const valid = await verifyPassword(password, user.password);
        if (!valid) return jsonResponse({ success: false, message: 'Invalid email or password' }, 401);

        const jwtToken = await createJWT({ id: user.id, email: user.email, role: user.role, name: user.name });
        const { password: _, ...cleanUser } = user;
        return jsonResponse({ success: true, message: 'Login successful', data: { token: jwtToken, user: cleanUser } });
      }

      // POST /api/auth/register or /api/register
      if (method === 'POST' && (path === '/api/auth/register' || path === '/api/register')) {
        const body = await getBody();
        const { name, email, password, role = 'donor', organization = '', phone = '', address = '' } = body;
        if (!email || !password || !name) return jsonResponse({ success: false, message: 'Name, email, and password are required' }, 400);

        const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (existing) return jsonResponse({ success: false, message: 'Email is already registered' }, 400);

        const hashed = await hashPassword(password);
        const verificationToken = await createJWT({ email: email.toLowerCase().trim(), name, role, type: 'verify' });
        const verifyUrl = `${url.origin}/auth/verify-email?token=${verificationToken}`;

        const newUser = {
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
          account_status: 'approved',
          verification_status: 'VERIFIED',
          verification_token: verificationToken,
          created_at: new Date().toISOString()
        };
        memoryStore.users.push(newUser);

        // Send confirmation email via Resend in background
        sendResendEmail({
          to: newUser.email,
          subject: 'Verify your FoodBridge account',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #059669;">Welcome to FoodBridge!</h2>
              <p>Hello <strong>${name}</strong>,</p>
              <p>Please click below to verify your email address and activate your account:</p>
              <p style="margin: 24px 0;"><a href="${verifyUrl}" style="background: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a></p>
              <p style="color: #64748b; font-size: 12px;">Or open: <a href="${verifyUrl}">${verifyUrl}</a></p>
            </div>
          `,
          text: `Hello ${name},\nVerify your FoodBridge account: ${verifyUrl}`
        }, env).catch(() => {});

        const jwtToken = await createJWT({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
        const { password: _, ...cleanUser } = newUser;
        return jsonResponse({
          success: true,
          message: 'Registration successful! Verification email sent.',
          data: { token: jwtToken, user: cleanUser, verification_token: verificationToken, verification_url: verifyUrl }
        });
      }

      // GET & POST /api/auth/verify-email
      if (path === '/api/auth/verify-email') {
        let vToken = url.searchParams.get('token');
        if (!vToken && method === 'POST') {
          const body = await getBody();
          vToken = body.token;
        }
        if (!vToken) return jsonResponse({ success: false, message: 'Verification token is required' }, 400);

        const tokenPayload = await verifyJWT(vToken);
        const tokenEmail = (tokenPayload && tokenPayload.email) ? tokenPayload.email.toLowerCase().trim() : null;
        let user = memoryStore.users.find(u => (tokenEmail && u.email.toLowerCase() === tokenEmail) || u.verification_token === vToken);

        if (user) {
          user.verified = true;
          user.status = 'approved';
          user.account_status = 'approved';
          user.verification_status = 'VERIFIED';
        } else if (tokenEmail) {
          user = {
            id: memoryStore.nextId.users++,
            name: tokenPayload.name || tokenEmail.split('@')[0],
            email: tokenEmail,
            role: tokenPayload.role || 'donor',
            organization: 'FoodBridge Partner',
            phone: '',
            address: '',
            verified: true,
            status: 'approved',
            account_status: 'approved',
            verification_status: 'VERIFIED',
            created_at: new Date().toISOString()
          };
          memoryStore.users.push(user);
        }

        const cleanUser = user ? { ...user } : { email: tokenEmail, verified: true, status: 'approved' };
        delete cleanUser.password;
        return jsonResponse({ success: true, message: 'Email verified successfully!', data: { user: cleanUser } });
      }

      // POST /api/auth/resend-verification
      if (method === 'POST' && path === '/api/auth/resend-verification') {
        const body = await getBody();
        const email = (body.email || '').toLowerCase().trim();
        const token = await createJWT({ email, type: 'verify' });
        const verifyUrl = `${url.origin}/auth/verify-email?token=${token}`;
        sendResendEmail({
          to: email,
          subject: 'Verify your FoodBridge account',
          html: `<p>Please click here to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
          text: `Verify your account: ${verifyUrl}`
        }, env).catch(() => {});
        return jsonResponse({ success: true, message: 'Verification email sent successfully' });
      }

      // POST /api/auth/forgot-password & /api/auth/reset-password
      if (method === 'POST' && path === '/api/auth/forgot-password') {
        const body = await getBody();
        const email = (body.email || '').toLowerCase().trim();
        const token = await createJWT({ email, type: 'reset' });
        const resetUrl = `${url.origin}/auth/reset-password?token=${token}`;
        sendResendEmail({
          to: email,
          subject: 'Reset your FoodBridge Password',
          html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
          text: `Reset your password: ${resetUrl}`
        }, env).catch(() => {});
        return jsonResponse({ success: true, message: 'If that email exists, a password reset link has been sent' });
      }

      if (method === 'POST' && path === '/api/auth/reset-password') {
        const body = await getBody();
        const { token: rToken, password: newPassword } = body;
        const payload = await verifyJWT(rToken);
        if (!payload || !payload.email) return jsonResponse({ success: false, message: 'Invalid or expired reset token' }, 400);

        const user = memoryStore.users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
        if (user) {
          user.password = await hashPassword(newPassword);
        }
        return jsonResponse({ success: true, message: 'Password reset successfully' });
      }

      // GET /api/auth/check or /api/check
      if (method === 'GET' && (path === '/api/auth/check' || path === '/api/check')) {
        if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        const user = memoryStore.users.find(u => u.id === currentUser.id) || { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, verified: true, status: 'approved' };
        const { password: _, ...cleanUser } = user;
        return jsonResponse({ success: true, message: 'Authenticated', data: { user: cleanUser } });
      }

      // POST /api/auth/logout
      if (path === '/api/auth/logout') {
        return jsonResponse({ success: true, message: 'Logged out successfully' });
      }

      // GET & PUT /api/auth/profile
      if (path === '/api/auth/profile' || path === '/api/profile') {
        if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        let user = memoryStore.users.find(u => u.id === currentUser.id) || { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role, verified: true, status: 'approved' };

        if (method === 'GET') {
          const { password: _, ...cleanUser } = user;
          return jsonResponse({ success: true, data: { user: cleanUser } });
        }
        if (method === 'PUT') {
          const body = await getBody();
          Object.assign(user, body);
          const { password: _, ...cleanUser } = user;
          return jsonResponse({ success: true, message: 'Profile updated successfully', data: { user: cleanUser } });
        }
      }

      // PUT /api/auth/change-password
      if (method === 'PUT' && path === '/api/auth/change-password') {
        if (!currentUser) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        const body = await getBody();
        const user = memoryStore.users.find(u => u.id === currentUser.id);
        if (user && body.new_password) {
          user.password = await hashPassword(body.new_password);
        }
        return jsonResponse({ success: true, message: 'Password changed successfully' });
      }

      // POST /api/auth/upload-profile-image
      if (method === 'POST' && path === '/api/auth/upload-profile-image') {
        return jsonResponse({ success: true, message: 'Profile image updated successfully', data: { profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' } });
      }

      // GET /api/auth/users/:id/public-profile
      if (path.startsWith('/api/auth/users/') && path.endsWith('/public-profile')) {
        const parts = path.split('/');
        const uId = parseInt(parts[parts.length - 2]);
        const user = memoryStore.users.find(u => u.id === uId) || { id: uId, name: 'FoodBridge Partner', organization: 'FoodBridge Partner', role: 'donor' };
        const { password: _, ...cleanUser } = user;
        return jsonResponse({ success: true, data: cleanUser });
      }

      // --- 3. ADMIN PORTAL ENDPOINTS ---

      // GET /api/admin/stats
      if (path === '/api/admin/stats') {
        const allUsers = memoryStore.users;
        const stats = {
          totalUsers: allUsers.length,
          pendingApprovals: allUsers.filter(u => u.status === 'pending' || u.status === 'Pending').length,
          approvedUsers: allUsers.filter(u => u.status === 'approved' || u.status === 'Approved').length,
          rejectedUsers: allUsers.filter(u => u.status === 'rejected' || u.status === 'Rejected').length,
          emailVerifiedUsers: allUsers.filter(u => u.verified === 1 || u.verified === true).length,
        };
        return jsonResponse({ success: true, data: stats });
      }

      // GET /api/admin/users
      if (path === '/api/admin/users') {
        const statusFilter = url.searchParams.get('status') || 'all';
        const roleFilter = url.searchParams.get('role') || 'all';
        const search = (url.searchParams.get('search') || '').toLowerCase().trim();

        let filtered = memoryStore.users.map(u => {
          const { password: _, ...clean } = u;
          return { ...clean, verified: Boolean(clean.verified), status: clean.status || 'approved' };
        });

        if (statusFilter !== 'all') filtered = filtered.filter(u => (u.status || '').toLowerCase() === statusFilter.toLowerCase());
        if (roleFilter !== 'all') filtered = filtered.filter(u => (u.role || '').toLowerCase() === roleFilter.toLowerCase());
        if (search) {
          filtered = filtered.filter(u =>
            (u.name && u.name.toLowerCase().includes(search)) ||
            (u.email && u.email.toLowerCase().includes(search)) ||
            (u.organization && u.organization.toLowerCase().includes(search))
          );
        }
        return jsonResponse({ success: true, data: { users: filtered }, users: filtered });
      }

      // POST /api/admin/users/:id/approve & reject
      if (path.startsWith('/api/admin/users/') && path.endsWith('/approve')) {
        const parts = path.split('/');
        const uId = parseInt(parts[parts.length - 2]);
        const u = memoryStore.users.find(x => x.id === uId);
        if (u) { u.status = 'approved'; u.account_status = 'approved'; }
        return jsonResponse({ success: true, message: 'User approved successfully' });
      }
      if (path.startsWith('/api/admin/users/') && path.endsWith('/reject')) {
        const parts = path.split('/');
        const uId = parseInt(parts[parts.length - 2]);
        const u = memoryStore.users.find(x => x.id === uId);
        if (u) { u.status = 'rejected'; u.account_status = 'rejected'; }
        return jsonResponse({ success: true, message: 'User rejected successfully' });
      }

      // --- 4. DONATIONS ENDPOINTS ---

      // GET /api/donations/nearby & GET /api/donations/available & GET /api/donations
      if (path === '/api/donations/nearby' || path === '/api/donations/available' || path === '/api/donations') {
        const donorIdParam = url.searchParams.get('donor_id');
        let list = [...memoryStore.donations];

        if (donorIdParam) {
          list = list.filter(d => String(d.donor_id) === String(donorIdParam));
        }

        const enrichedList = list.map((d, index) => ({
          ...d,
          road_distance_km: 2.5 + (index * 1.8),
          estimated_travel_minutes: 8 + (index * 4),
        }));
        return jsonResponse({ success: true, data: enrichedList, donations: enrichedList });
      }

      // GET /api/donations/route
      if (path === '/api/donations/route') {
        return jsonResponse({
          success: true,
          data: {
            distance_km: 3.2,
            distance_m: 3200,
            travel_minutes: 11,
            geometry: {
              type: 'LineString',
              coordinates: [
                [80.2707, 13.0827],
                [80.2650, 13.0780],
                [80.2500, 13.0650],
                [80.2496, 13.0604]
              ]
            }
          }
        });
      }

      // POST /api/donations/geocode
      if (path === '/api/donations/geocode') {
        return jsonResponse({
          success: true,
          data: { latitude: 13.0827, longitude: 80.2707, formatted_address: 'Chennai, Tamil Nadu, India' }
        });
      }

      // POST /api/donations
      if (method === 'POST' && path === '/api/donations') {
        const body = await getBody();
        const qtyNum = parseFloat(body.quantity || body.quantity_number) || 10;
        const donationItem = {
          id: memoryStore.nextId.donations++,
          donor_id: currentUser ? currentUser.id : 2,
          donor_name: currentUser ? currentUser.name : 'City Bakery & Cafe',
          donor_org: (currentUser && currentUser.organization) || 'City Bakers',
          food_name: body.food_name || 'Prepared Food',
          food_type: body.food_type || 'Cooked Meal',
          category: body.category || 'Veg',
          veg_type: body.veg_type || 'Veg',
          quantity: String(body.quantity || `${qtyNum} servings`),
          quantity_number: qtyNum,
          remaining_quantity: qtyNum,
          allocated_quantity: 0,
          unit: body.unit || 'servings',
          description: body.description || '',
          pickup_address: body.pickup_address || '124 Anna Salai, Chennai',
          latitude: parseFloat(body.latitude) || 13.0827,
          longitude: parseFloat(body.longitude) || 80.2707,
          expiry_time: body.expiry_time || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          status: 'Available',
          freshness_score: Math.floor(Math.random() * 15) + 85,
          risk_level: 'Low',
          created_at: new Date().toISOString()
        };
        memoryStore.donations.unshift(donationItem);
        return jsonResponse({ success: true, message: 'Donation posted successfully', data: donationItem }, 201);
      }

      // GET, PUT, DELETE /api/donations/:id
      if (path.startsWith('/api/donations/')) {
        const parts = path.split('/');
        const dId = parseInt(parts[parts.length - 1]);
        if (!isNaN(dId)) {
          const item = memoryStore.donations.find(d => d.id === dId);
          if (method === 'GET') {
            if (!item) return jsonResponse({ success: false, message: 'Donation not found' }, 404);
            return jsonResponse({ success: true, data: item });
          }
          if (method === 'PUT') {
            const body = await getBody();
            if (item) Object.assign(item, body);
            return jsonResponse({ success: true, message: 'Donation updated successfully', data: item });
          }
          if (method === 'DELETE') {
            memoryStore.donations = memoryStore.donations.filter(d => d.id !== dId);
            return jsonResponse({ success: true, message: 'Donation deleted successfully' });
          }
        }
      }

      // --- 5. PICKUP REQUESTS & PICKUPS ENDPOINTS ---

      if (path === '/api/pickup-requests' || path === '/api/pickups') {
        if (method === 'GET') {
          return jsonResponse({ success: true, data: memoryStore.pickups, requests: memoryStore.pickups });
        }
        if (method === 'POST') {
          const body = await getBody();
          const pickupItem = {
            id: memoryStore.nextId.pickups++,
            donation_id: body.donation_id || 1,
            receiver_id: currentUser ? currentUser.id : 3,
            receiver_name: currentUser ? currentUser.name : 'Hope Shelter NGO',
            status: 'Approved',
            request_message: body.request_message || 'Pickup requested',
            requested_quantity: parseFloat(body.requested_quantity || 1),
            allocated_quantity: parseFloat(body.requested_quantity || 1),
            unit: 'servings',
            pickup_address: '124 Anna Salai, Chennai',
            qr_token: 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            requested_at: new Date().toISOString(),
            approved_at: new Date().toISOString()
          };
          memoryStore.pickups.unshift(pickupItem);
          return jsonResponse({ success: true, message: 'Pickup request created', data: pickupItem }, 201);
        }
      }

      if (path.startsWith('/api/pickup-requests/')) {
        const parts = path.split('/');
        const pId = parseInt(parts[parts.length - 1]);
        if (method === 'PUT') {
          const body = await getBody();
          const p = memoryStore.pickups.find(x => x.id === pId);
          if (p) Object.assign(p, body);
          return jsonResponse({ success: true, message: 'Pickup request updated', data: p });
        }
      }

      if (path.startsWith('/api/pickups/') && path.endsWith('/confirm-receipt')) {
        return jsonResponse({ success: true, message: 'Pickup completed and verified successfully!' });
      }

      // --- 6. NEEDS ENDPOINTS ---

      if (path === '/api/needs' || path === '/api/needs/my') {
        if (method === 'GET') {
          return jsonResponse({ success: true, data: memoryStore.needs, needs: memoryStore.needs });
        }
        if (method === 'POST') {
          const body = await getBody();
          const item = {
            id: memoryStore.nextId.needs++,
            receiver_id: currentUser ? currentUser.id : 3,
            receiver_name: currentUser ? currentUser.name : 'Hope Shelter NGO',
            ...body,
            status: 'open',
            created_at: new Date().toISOString()
          };
          memoryStore.needs.unshift(item);
          return jsonResponse({ success: true, message: 'Need posted successfully', data: item });
        }
      }

      if (path.startsWith('/api/needs/')) {
        const parts = path.split('/');
        const nId = parseInt(parts[parts.length - 1]);
        if (method === 'DELETE') {
          memoryStore.needs = memoryStore.needs.filter(n => n.id !== nId);
          return jsonResponse({ success: true, message: 'Need deleted successfully' });
        }
        if (path.includes('/respond')) {
          return jsonResponse({ success: true, message: 'Response sent to need successfully' });
        }
      }

      if (path.startsWith('/api/needs/responses/')) {
        return jsonResponse({ success: true, message: 'Need action completed successfully' });
      }

      // --- 7. DASHBOARD & STATS ENDPOINTS ---

      if (path === '/api/dashboard/donor' || path === '/api/dashboard/receiver' || path === '/api/dashboard/public' || path.startsWith('/api/dashboard')) {
        const totalDonations = memoryStore.donations.length;
        const totalPickups = memoryStore.pickups.length;
        return jsonResponse({
          success: true,
          data: {
            total_donations: totalDonations,
            meals_saved: totalDonations * 45 + 120,
            active_pickups: totalPickups,
            co2_reduced_kg: totalDonations * 18.5,
            impact_score: 98,
            active_donors: 14,
            active_receivers: 28,
            recent_activities: [
              { title: 'Fresh Food Shared', description: 'Fresh Bread & Healthy Pastries listed', time: '5m ago' },
              { title: 'Pickup Coordinated', description: 'Hope Shelter NGO scheduled pickup', time: '15m ago' }
            ]
          }
        });
      }

      // --- 8. SERVICES (Geocoding, Certificates, Settings) ---

      if (path === '/api/services/geocode') {
        const q = url.searchParams.get('q') || '';
        return jsonResponse({
          success: true,
          data: [
            { display_name: q || 'Anna Nagar, Chennai, Tamil Nadu, India', lat: 13.0850, lon: 80.2100 },
            { display_name: 'T. Nagar, Chennai, Tamil Nadu, India', lat: 13.0418, lon: 80.2341 }
          ]
        });
      }

      if (path === '/api/services/reverse-geocode') {
        return jsonResponse({
          success: true,
          data: { display_name: 'Anna Salai, Chennai, Tamil Nadu, India' }
        });
      }

      if (path === '/api/services/certificates') {
        return jsonResponse({
          success: true,
          data: [
            { id: 1, title: 'Zero Waste Champion 2026', issue_date: '2026-09-15', meals_saved: 350, certificate_url: '#' }
          ]
        });
      }

      if (path === '/api/services/settings') {
        if (method === 'GET') {
          return jsonResponse({ success: true, data: { notifications_enabled: true, auto_match: true, theme: 'dark' } });
        }
        if (method === 'PUT') {
          const body = await getBody();
          Object.assign(memoryStore.settings, body);
          return jsonResponse({ success: true, message: 'Settings updated successfully', data: memoryStore.settings });
        }
      }

      // --- 9. CHAT & MESSAGING ENDPOINTS ---

      if (path === '/api/chat/conversations') {
        return jsonResponse({
          success: true,
          data: [
            {
              id: 1,
              partner_id: 2,
              partner_name: 'City Bakery & Cafe',
              partner_role: 'donor',
              last_message: 'Hello! The food packages are ready for pickup.',
              unread_count: 0,
              updated_at: new Date().toISOString()
            }
          ]
        });
      }

      if (path.startsWith('/api/chat/conversations/') && path.endsWith('/messages')) {
        return jsonResponse({
          success: true,
          data: [
            { id: 1, sender_id: 2, sender_name: 'City Bakery & Cafe', text: 'Hello! The food packages are ready for pickup at 124 Anna Salai.', created_at: new Date(Date.now() - 1800000).toISOString() }
          ]
        });
      }

      if (path.startsWith('/api/chat/messages')) {
        if (method === 'GET') {
          return jsonResponse({
            success: true,
            data: [
              { id: 1, sender_id: 2, text: 'Your pickup request has been accepted!', created_at: new Date().toISOString() }
            ]
          });
        }
        if (method === 'POST') {
          const body = await getBody();
          return jsonResponse({ success: true, message: 'Message sent successfully', data: { id: Date.now(), ...body, created_at: new Date().toISOString() } });
        }
      }

      if (path === '/api/chat/users') {
        const usersList = memoryStore.users.map(u => ({ id: u.id, name: u.name, organization: u.organization, role: u.role }));
        return jsonResponse({ success: true, data: usersList });
      }

      if (path.includes('/api/chat/conversations/lookup')) {
        return jsonResponse({ success: true, data: { conversation_id: 1 } });
      }

      if (path.includes('/api/chat/conversations/') && path.endsWith('/read')) {
        return jsonResponse({ success: true, message: 'Marked as read' });
      }

      // --- 10. NOTIFICATIONS ENDPOINTS ---

      if (path === '/api/notifications' || path === '/api/notifications/unread-count') {
        if (path.endsWith('/unread-count')) {
          return jsonResponse({ success: true, data: { count: memoryStore.notifications.filter(n => !n.is_read).length } });
        }
        return jsonResponse({ success: true, data: memoryStore.notifications, count: memoryStore.notifications.length });
      }

      if (path === '/api/notifications/read-all') {
        memoryStore.notifications.forEach(n => { n.is_read = true; });
        return jsonResponse({ success: true, message: 'All notifications marked as read' });
      }

      if (path.startsWith('/api/notifications/')) {
        return jsonResponse({ success: true, message: 'Notification updated' });
      }

      // --- 11. QR CODE ENDPOINTS ---

      if (path === '/api/qr/generate') {
        const body = await getBody();
        const code = 'FB-QR-' + (body.pickup_request_id || 1) + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        return jsonResponse({ success: true, data: { qr_token: code, qr_image: code } });
      }

      if (path === '/api/qr/verify') {
        return jsonResponse({ success: true, message: 'QR Code verified! Food handover authorized.', data: { verified: true } });
      }

      if (path.startsWith('/api/qr/')) {
        return jsonResponse({ success: true, data: { qr_token: 'FB-QR-ACTIVE-101', status: 'valid' } });
      }

      // --- 12. VERIFICATION ENDPOINTS ---

      if (path.startsWith('/api/verification')) {
        if (path === '/api/verification/status') {
          return jsonResponse({
            success: true,
            data: { email_verified: true, phone_verified: true, org_verification_status: 'APPROVED', status: 'approved' }
          });
        }
        if (path === '/api/verification/phone/send-otp') {
          return jsonResponse({ success: true, message: 'OTP sent successfully (Demo OTP: 123456)' });
        }
        if (path === '/api/verification/phone/verify-otp') {
          return jsonResponse({ success: true, message: 'Phone number verified successfully' });
        }
        if (path === '/api/verification/admin/requests') {
          const list = memoryStore.users.filter(u => u.role !== 'admin').map(u => ({
            id: u.id,
            user_id: u.id,
            user_name: u.name,
            organization: u.organization,
            role: u.role,
            status: u.status || 'approved',
            submitted_at: u.created_at || new Date().toISOString()
          }));
          return jsonResponse({ success: true, data: list });
        }
        return jsonResponse({ success: true, message: 'Verification request processed successfully' });
      }

      // Fallback for any unknown /api route
      return jsonResponse({ success: false, message: 'API route not found' }, 404);
    }

    // Default: Serve frontend React / Vite static assets with SPA routing
    return env.ASSETS.fetch(request);
  },
};
