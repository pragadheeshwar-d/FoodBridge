# Cloudflare Pages Deployment Guide for FoodBridge

This guide explains how to deploy the FoodBridge frontend to **Cloudflare Pages**.

---

## Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/).
2. Your backend deployed (e.g. on Render, Railway, Fly.io, or VPS) with public HTTPS URL (e.g., `https://foodbridge-api.onrender.com`).

---

## Method 1: Deploy via Cloudflare Dashboard (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your repository (`FoodBridge_Deployment`).
5. Configure the build settings:
   - **Project name**: `food-bridge` (or your choice)
   - **Production branch**: `main` (or your default branch)
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank or default)
6. Add **Environment Variables** in the Cloudflare settings:
   - `VITE_API_URL` = `https://your-backend-api-url.com`
   - `VITE_SOCKET_URL` = `https://your-backend-api-url.com`
   - `NODE_VERSION` = `20`
7. Click **Save and Deploy**.

---

## Method 2: Deploy via Wrangler CLI

You can also deploy directly from your local terminal using Wrangler:

1. Log in to your Cloudflare account:
   ```bash
   npx wrangler login
   ```

2. Build the project with your production environment variables:
   - Make sure your `.env` or environment variables contain:
     ```env
     VITE_API_URL=https://your-backend-api-url.com
     VITE_SOCKET_URL=https://your-backend-api-url.com
     ```
   - Run the build:
     ```bash
     npm run build
     ```

3. Deploy the `dist` folder to Cloudflare Pages:
   ```bash
   npm run deploy
   # or: npx wrangler pages deploy dist --project-name=food-bridge
   ```

---

## SPA Routing & Headers Configuration

The project already includes:
- `public/_redirects`: Configured with `/*  /index.html  200` for client-side React Router navigation.
- `public/_headers`: Configured with security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) and cache optimization for `/assets/*`.
- `wrangler.toml`: Configured with `pages_build_output_dir = "dist"`.

---

## Important Post-Deployment Step

Update your backend's `FRONTEND_URL` environment variable to match your Cloudflare Pages URL (e.g., `https://food-bridge.pages.dev` or your custom domain) to ensure CORS and authentication redirects work properly.
