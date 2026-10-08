# FoodBridge — Complete Project Report
### Vigyan-26 Hackathon Submission

---

## 1. Executive Summary

**FoodBridge** is a full-stack web platform that bridges the gap between food donors (restaurants, hotels, households) and food receivers (NGOs, shelters, food banks) across Tamil Nadu. The platform uses real-time Socket.IO notifications, QR-code verified pickups, and automated certificate generation to create a transparent, efficient, and scalable food redistribution network.

---

## 2. Problem Statement

Over 40% of food produced in India is wasted. Simultaneously, millions go hungry every day. The core disconnect is logistics and information asymmetry — donors don't know who needs food, and NGOs don't know what's available nearby in time. FoodBridge solves this with technology.

---

## 3. Solution Overview

| Feature | Technology | Status |
|---|---|---|
| Role-based auth (Donor / Receiver / Admin) | Flask-JWT + bcrypt | ✅ Live |
| Email verification + password reset | Flask-Mail | ✅ Live |
| Donation listing with image upload | Flask REST + Base64 | ✅ Live |
| Real-time notifications | Flask-SocketIO | ✅ Live |
| Live receiver dashboard updates | Socket.IO push | ✅ Live |
| QR code generation + verification | qrcode + UUID tokens | ✅ Live |
| Automatic certificate generation | SQLAlchemy + REST | ✅ Live |
| Real-time donor↔receiver chat | Socket.IO + MySQL | ✅ Live |
| Analytics dashboards | MySQL aggregation | ✅ Live |
| Admin user approval panel | Flask REST + React | ✅ Live |
| Google Maps integration (UI) | MapMock → Maps API | ✅ UI Ready |

---

## 4. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | TailwindCSS 3 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Real-time | Socket.IO Client v4 |
| Charts | Recharts |
| Animations | Framer Motion |

### Backend
| Layer | Technology |
|---|---|
| Framework | Python Flask 3.1 |
| ORM | SQLAlchemy 2.0 + Flask-SQLAlchemy |
| Database | MySQL (PyMySQL driver) |
| Authentication | Flask-JWT-Extended + bcrypt |
| Real-time | Flask-SocketIO + eventlet |
| Email | Flask-Mail (Gmail SMTP) |
| QR Codes | qrcode library |
| AI Prediction | Rule-based Python service |
| WSGI Server | Gunicorn + eventlet worker |
| CORS | Flask-CORS |

### Deployment
| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | PlanetScale / Railway MySQL |

---

## 5. Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(120) UNIQUE | Login email |
| password | VARCHAR(255) | bcrypt hash |
| role | VARCHAR(20) | donor / receiver / admin / super_admin |
| organization | VARCHAR(150) | Business/NGO name |
| phone | VARCHAR(20) | Contact number |
| address | VARCHAR(255) | Physical address |
| profile_image | TEXT | Base64 image |
| business_type | VARCHAR(50) | restaurant / hotel / caterer / etc. |
| verification_id | VARCHAR(100) | Govt reg ID for receivers |
| verified | BOOLEAN | Email confirmed |
| status | VARCHAR(20) | pending / approved / rejected / suspended |
| verification_token | VARCHAR(100) | UUID email token |
| reset_token | VARCHAR(100) | UUID password reset token |
| created_at | DATETIME | Timestamp |

### `donations`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| donor_id | INT FK | references users.id |
| food_name | VARCHAR(150) | e.g. "Chettinad Biryani" |
| food_type | VARCHAR(50) | Cooked Rice / Curry / Bread / etc. |
| category | VARCHAR(50) | main / snacks / dessert / etc. |
| veg_type | VARCHAR(20) | veg / nonveg / vegan |
| quantity | VARCHAR(50) | "50 meals" or "10 kg" |
| quantity_number | FLOAT | Numeric value |
| unit | VARCHAR(20) | meals / kg |
| image | TEXT | Base64 photo |
| pickup_address | VARCHAR(255) | Full address |
| latitude | FLOAT | GPS coordinate |
| longitude | FLOAT | GPS coordinate |
| expiry_time | DATETIME | Hard deadline |
| preparation_time | VARCHAR(50) | HH:MM when food was prepared |
| status | VARCHAR(20) | Available / Requested / Approved / Completed / Expired |
| created_at | DATETIME | Timestamp |

### `pickup_requests`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| donation_id | INT FK | references donations.id |
| receiver_id | INT FK | references users.id |
| status | VARCHAR(20) | Pending / Approved / Rejected / Completed |
| qr_token | VARCHAR(100) UNIQUE | UUID for QR verification |
| qr_used | BOOLEAN | Prevents replay attacks |
| requested_at | DATETIME | When receiver requested |
| approved_at | DATETIME | When donor approved |
| completed_at | DATETIME | When QR verified |

### `notifications`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| user_id | INT FK | references users.id |
| title | VARCHAR(150) | Short title |
| message | TEXT | Full message |
| type | VARCHAR(50) | new_donation / pickup_requested / etc. |
| is_read | BOOLEAN | Read status |
| link | VARCHAR(255) | Frontend route |
| created_at | DATETIME | Timestamp |

### `messages`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| sender_id | INT FK | references users.id |
| receiver_id | INT FK | references users.id |
| message | TEXT | Message content |
| is_read | BOOLEAN | Seen status |
| created_at | DATETIME | Timestamp |

### `certificates`
| Column | Type | Description |
|---|---|---|
| id | INT PK | Auto-increment |
| donation_id | INT FK | references donations.id |
| donor_id | INT FK | references users.id |
| receiver_id | INT FK | references users.id |
| certificate_url | VARCHAR(255) | Download path |
| generated_at | DATETIME | Timestamp |

---

## 6. API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register with email verification |
| POST | `/login` | No | Returns JWT token |
| POST | `/verify-email` | No | Activate account from email link |
| POST | `/resend-verification` | No | Resend verification email |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password` | No | Set new password via token |
| GET | `/profile` | JWT | Get current user |
| PUT | `/profile` | JWT | Update name, phone, address, avatar |

### Donations (`/api/donations`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Optional | List all (filter: status, donor_id) |
| GET | `/available` | No | Active non-expired donations |
| POST | `/` | JWT Donor | Create donation |
| GET | `/:id` | No | Single donation |
| PUT | `/:id` | JWT | Update status/details |
| DELETE | `/:id` | JWT | Delete donation |

### Pickups (`/api/pickups`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | Role-aware list |
| POST | `/` | JWT Receiver | Create pickup request |
| PUT | `/:id` | JWT | Approve / Reject / Complete |
| POST | `/:id/qr` | JWT | Generate QR code image |
| POST | `/qr/verify` | JWT | Verify scanned QR token |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/donor` | JWT | Donor stats + monthly data |
| GET | `/receiver` | JWT | Receiver stats + monthly data |
| GET | `/admin` | JWT Admin | Platform-wide stats |

### Chat (`/api/chat`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | JWT | All chat partners + last message |
| GET | `/messages/:partnerId` | JWT | Full message history |
| POST | `/messages` | JWT | Send message (also emits socket) |
| GET | `/users` | JWT | Eligible chat partners |

### Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | All notifications (limit param) |
| GET | `/unread-count` | JWT | Badge count |
| PUT | `/:id/read` | JWT | Mark single read |
| PUT | `/read-all` | JWT | Mark all read |
| POST | `/broadcast` | JWT Admin | Send to all / by role |

### Services (`/api/services`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/certificates` | JWT | User's certificates |
| GET | `/admin/users` | JWT Admin | All users (filter: role, status) |
| PUT | `/admin/users/:id` | JWT Admin | Approve / suspend / change role |
| DELETE | `/admin/users/:id` | JWT Admin | Delete user |

---

## 7. Real-Time Events (Socket.IO)

### Server → Client
| Event | Trigger | Payload |
|---|---|---|
| `new_donation` | Donor creates donation | Full donation object |
| `pickup_requested` | Receiver requests | `{pickup_request, donation}` |
| `pickup_status_changed` | Approve/Reject/Complete | `{pickup_request, donation}` |
| `notification` | Any system event | Notification object |
| `new_message` | Chat message sent | Message object |
| `messages_read` | Partner reads messages | `{message_ids}` |
| `analytics_updated` | Pickup completed | `{}` (triggers dashboard refresh) |
| `donation_updated` | Donation status change | Full donation object |

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join` | `{user_id}` | Join user-private room |
| `send_message` | `{sender_id, receiver_id, message}` | Real-time chat |
| `typing` | `{sender_id, receiver_id}` | Show typing indicator |
| `stop_typing` | `{sender_id, receiver_id}` | Hide typing indicator |
| `mark_read` | `{message_ids, sender_id}` | Mark messages read |

---

## 8. QR Code Pickup Verification

1. Donor approves pickup request → `POST /api/pickups/:id/qr`
2. Server generates UUID token, stores in `pickup_requests.qr_token`
3. QR image returned as base64 PNG — displayed on receiver's schedule page
4. Receiver presents QR at collection point
5. Donor scans → `POST /api/pickups/qr/verify` with token
6. Server validates: token exists, not used, request in `Approved` state
7. Marks `qr_used=True` (prevents replay attacks)
8. Sets pickup `Completed`, donation `Completed`
9. Certificate record created, both parties notified via Socket.IO

---

## 10. Complete User Flow

```
Register → Email Verification → Admin Approval
        ↓
      Login → Role Redirect (donor/receiver/admin)
        ↓
   DONOR: Add Donation
        ↓
   Socket.IO broadcasts → All approved receivers notified
        ↓
   RECEIVER: Sees donation appear live → Clicks "Request Pickup"
        ↓
   DONOR: Receives real-time notification → Approve/Reject
        ↓
   On Approve: QR Code generated, receiver notified
        ↓
   RECEIVER: Shows QR code at pickup location
        ↓
   DONOR: Scans QR → Verifies → Status = Completed
        ↓
   Certificate auto-generated → Both parties notified
        ↓
   Analytics dashboards update in real-time
```

---

## 11. Security

| Mechanism | Implementation |
|---|---|
| Password hashing | bcrypt with per-user salt |
| Authentication | JWT (24h expiry, signed with secret) |
| Email verification | UUID tokens with 24h expiry |
| QR anti-replay | `qr_used` boolean flag, single-use tokens |
| Route protection | JWT middleware on all write endpoints |
| Role enforcement | Backend checks role on every sensitive endpoint |
| CORS | Configured per environment |
| SQL injection | SQLAlchemy ORM (parameterized queries only) |
| XSS | React's built-in escaping + Content-Type headers |

---

## 12. Deployment Guide

### Frontend → Vercel (Free)

1. Push code to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   VITE_SOCKET_URL = https://your-backend.onrender.com
   ```
6. Deploy

### Backend → Render (Free)

1. Push `backend/` folder to GitHub (or same repo)
2. Create new **Web Service** on [render.com](https://render.com)
3. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
4. Add environment variables:
   ```
   DATABASE_URL     = mysql+pymysql://user:pass@host/foodbridge
   SECRET_KEY       = <random 64-char string>
   JWT_SECRET_KEY   = <random 64-char string>
   MAIL_USERNAME    = your-email@gmail.com
   MAIL_PASSWORD    = your-gmail-app-password
   FRONTEND_URL     = https://your-app.vercel.app
   FLASK_ENV        = production
   ```
5. Deploy → Run `init_db.py` via Render Shell once to seed admin

### Database → Railway MySQL (Free tier)

1. Create project at [railway.app](https://railway.app)
2. Add MySQL plugin
3. Copy the `DATABASE_URL` to Render environment variables

---

## 13. Default Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Super Admin | admin@foodbridge.com | Admin@1234 | `/admin` — full platform control |

> ⚠️ Change the admin password immediately after first login in production.

---

## 14. Performance & Scalability Notes

- **Socket.IO** uses eventlet for async I/O — supports hundreds of concurrent connections on a single worker
- **Database queries** use SQLAlchemy lazy loading with relationship backref — N+1 queries avoided on list endpoints
- **Images** stored as Base64 in MySQL TEXT columns (suitable for hackathon; production should use S3/Cloudinary)
- **QR tokens** stored in DB (not in-memory) — survives server restarts
- **JWT** stateless — horizontally scalable without session sharing

---

## 15. Project Statistics

| Metric | Count |
|---|---|
| Total source files | 65+ |
| Backend Python files | 15 |
| Frontend TypeScript/TSX files | 50+ |
| API endpoints | 35 |
| Socket.IO events | 12 |
| Database tables | 6 |
| React pages | 22 |
| React hooks | 7 |
| Lines of code (est.) | 8,000+ |

---

## 16. Team

**FoodBridge** — Built for Vigyan-26 Hackathon  
Theme: Technology for Social Good  
Domain: Food Security & Waste Reduction  
Region: Tamil Nadu, India

---

*Report generated: July 2026*
