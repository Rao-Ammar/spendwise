# SpendWise

SpendWise is a personal finance tracker built with React, Vite, Express, and MongoDB Atlas.

## Project layout

- `frontend/` - React and Vite single-page application
- `backend/` - Express API, Mongoose models, JWT authentication, and Excel exports

## Run locally

1. In `backend/`, copy `.env.example` to `.env` and set `MONGO_URI` and a long random `JWT_SECRET`.
2. Start the API from `backend/` with `npm ci` then `npm run dev`. It listens on port `5000` by default.
3. In `frontend/`, create `.env.local` containing `VITE_API_BASE_URL=http://localhost:5000`.
4. Start the frontend from `frontend/` with `npm ci` then `npm run dev`.

Never commit `.env`, database connection strings, passwords, or generated exports.

## Deploy with Vercel

This repository uses two Vercel projects connected to the same GitHub repository.

### 1. Deploy the API

Create a Vercel project for `Rao-Ammar/spendwise` and set its **Root Directory** to `backend`. Vercel detects the Express app from `server.js`.

Add these environment variables in the API project's Production environment:

- `MONGO_URI` - your rotated MongoDB Atlas connection string
- `JWT_SECRET` - a long random value
- `JWT_EXPIRY` - `24h`
- `FRONTEND_ORIGIN` - the production frontend origin, such as `https://spendwise.vercel.app`

Deploy, then note the API project's `.vercel.app` URL.

### 2. Deploy the frontend

Create another Vercel project from the same repository and set its **Root Directory** to `frontend`. Use the Vite defaults: build command `npm run build`, output directory `dist`.

Set this environment variable before deploying:

- `VITE_API_BASE_URL` - the API project's origin, with no trailing slash, such as `https://spendwise-api.vercel.app`

The frontend's `vercel.json` rewrites deep links to `index.html`, so routes such as `/login` and `/dashboard` load directly.

If Vercel gives the frontend a different URL, update `FRONTEND_ORIGIN` on the API project and redeploy the API. Keep the MongoDB Atlas network access list restricted to the hosting access pattern you choose.
