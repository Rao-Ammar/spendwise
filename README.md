# SpendWise

A personal finance tracker with a React frontend and an Express/MongoDB API.

## Project layout

- `frontend/` - React, Vite, Tailwind CSS, and React Router
- `backend/` - Express API, Mongoose models, JWT authentication, and Excel exports

## Run locally

1. In `backend/`, copy `.env.example` to `.env` and set `MONGO_URI` and a long random `JWT_SECRET`.
2. Start the API from `backend/` with `npm ci` then `npm run dev`. It listens on port `5000` by default.
3. In `frontend/`, create `.env.local` containing `VITE_API_BASE_URL=http://localhost:5000`.
4. Start the frontend from `frontend/` with `npm ci` then `npm run dev`.

Never commit `.env`, database connection strings, passwords, or generated exports.

## Deploy with Render

The root `render.yaml` describes a Render Blueprint with an Express web service and a React static site. Connect this repository in Render using **New → Blueprint**. During setup, provide `MONGO_URI` as a secret value. Render generates `JWT_SECRET`; the frontend and API origins are configured for the service names in the Blueprint.

After the first deploy, confirm the service URLs match `https://spendwise-api.onrender.com` and `https://spendwise-web.onrender.com`. If Render assigns different URLs, update `VITE_API_BASE_URL` on the static site and `FRONTEND_ORIGIN` on the API, then redeploy. Configure Atlas Network Access so the hosted API can reach the cluster; keep access as restricted as the hosting plan allows.

Render rewrites frontend routes to `index.html` so direct visits to `/login`, `/dashboard`, and other client routes work.
