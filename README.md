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

## Deploy with Render

This repository includes a root-level `render.yaml` Blueprint that deploys both services from the same GitHub repository:

- `spendwise-api` - Express API from `backend/`
- `spendwise-web` - Vite static site from `frontend/`

### Deploy

1. In Render, choose **New → Blueprint** and connect the private `Rao-Ammar/spendwise` repository.
2. If the repository is missing, install/configure Render's GitHub App and grant it access to `spendwise` under Repository access.
3. Select the `main` branch and leave the Blueprint path as `render.yaml`.
4. Review the two services and provide `MONGO_URI` when Render prompts for the secret. Use a newly rotated MongoDB Atlas password in the URI; do not commit it to GitHub.
5. Deploy the Blueprint. Render generates `JWT_SECRET` from the Blueprint.
6. When both services are live, check the API service's `/health` endpoint. The frontend uses `https://spendwise-api.onrender.com` as its API base URL, and the API allows `https://spendwise-web.onrender.com` through CORS.

The backend uses Render's `PORT` and has a `/health` endpoint. The frontend Blueprint includes an SPA rewrite so direct visits to routes such as `/login` and `/dashboard` work.

Free Render web services can spin down while idle and take time to wake on the next request. See Render's current [free instance limitations](https://render.com/docs/free).
