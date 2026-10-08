# Food Bridge Deployment Guide

## Architecture
- Frontend: React + Vite on Vercel
- Backend: Flask API on Render
- Database: Render Postgres
- Real-time: Flask-SocketIO

## 1. Push the repo
Make sure your Git remote is set:

```bash
git remote -v
```

If needed, push the current branch to GitHub before deploying.

## 2. Deploy the backend on Render
Use the root `render.yaml` blueprint in this repo.

Render will create:
- `foodbridge-api` web service
- `foodbridge-db` Postgres database

Important backend env vars:
- `DATABASE_URL` from the Render database
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `FRONTEND_URL` set to your Vercel URL
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_DEFAULT_SENDER`

The backend service:
- Build command: `cd backend && pip install -r requirements.txt`
- Start command: `cd backend && gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`
- Health check: `/api/health`

After deploy, initialize the database from the Render shell:

```bash
cd backend && python init_db.py
```

## 3. Deploy the frontend on Vercel
Import the repo into Vercel.

Set these environment variables:
- `VITE_API_URL` = your Render backend URL
- `VITE_SOCKET_URL` = your Render backend URL

Vercel settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root: repository root

## 4. Update cross-origin settings
Set Render `FRONTEND_URL` to the final Vercel URL so email links and CORS point to the live site.

## 5. Verify
Check these URLs:
- Frontend: your Vercel deployment URL
- Backend health: `https://<render-backend>/api/health`

Test flow:
1. Open the frontend
2. Sign in as donor or receiver
3. Confirm API requests hit Render
4. Confirm Socket.IO and notifications work

## 6. Common issues
- Blank frontend: check `VITE_API_URL`
- Backend 500s: check Render logs and database connection
- Login issues: run `python init_db.py` again
- CORS errors: confirm `FRONTEND_URL` matches the Vercel URL exactly
