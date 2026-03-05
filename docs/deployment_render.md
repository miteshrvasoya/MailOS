# Deploying MailOS Backend to Render

This guide provides step-by-step instructions for deploying the FastAPI backend of MailOS to [Render](https://render.com).

## Prerequisites
- A Render account.
- Your MailOS code pushed to a GitHub or GitLab repository.
- An OpenAI API Key (optional, for AI features).
- Google Cloud Console credentials (for Gmail integration).

## Step 1: Create a PostgreSQL Database
The MailOS backend requires a PostgreSQL database.

1. Log in to your Render Dashboard.
2. Click **New +** and select **PostgreSQL**.
3. Name your database (e.g., `mailos-db`).
4. Select a region (choose the same region for your database and web service to minimize latency).
5. Choose a plan (the "Free" plan is sufficient for testing).
6. Click **Create Database**.
7. Once created, keep the page open or copy the **Internal Database URL** for the web service.

## Step 2: Create a Web Service
1. Click **New +** and select **Web Service**.
2. Connect your GitHub repository containing the MailOS code.
3. Configure the following settings:
   - **Name**: `mailos-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Select your preferred instance type (the free tier works well).

## Step 3: Configure Environment Variables
In the Render Web Service settings, go to the **Environment** tab and add the following variables:

| Variable | Value |
| :--- | :--- |
| `POSTGRES_SERVER` | The hostname from your Render DB (e.g., `dpg-...-a.render.com`) |
| `POSTGRES_USER` | Your Render DB username |
| `POSTGRES_PASSWORD` | Your Render DB password |
| `POSTGRES_DB` | Your Render DB name |
| `POSTGRES_PORT` | `5432` |
| `OPENAI_API_KEY` | Your OpenAI secret key |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://www.mailos.in/api/auth/callback/google` |
| `BACKEND_CORS_ORIGINS` | `["https://www.mailos.in"]` |

> [!TIP]
> You can also use a single variable `SQLALCHEMY_DATABASE_URI` with the full connection string provided by Render if you prefer.

## Step 4: Database Migrations
The backend is configured to initialize the database on startup (via `app/main.py`), which works for the initial setup.

For production updates, it is recommended to run migrations using Alembic:
1. Shell into the Render instance or use a [Blueprint](https://render.com/docs/blueprints) to run `alembic upgrade head`.

## Step 5: Update Google OAuth Redirect URI
Ensure that your authorized redirect URIs in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) include the production URL of your frontend.

---
**Your backend is now live!** You can verify it by visiting `https://your-backend-url.onrender.com/` which should return:
```json
{"message": "Welcome to MailOS Backend"}
```
