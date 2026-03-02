# SplitEasy — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL database

---

## 1. Install dependencies

```bash
npm install
```

## 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/spliteasy"
AUTH_SECRET="your-random-secret"        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 3. Get Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the **Client ID** and **Client Secret** into your `.env`

## 4. Set up the database

Run Prisma migrations to create the tables:

```bash
npx prisma migrate dev --name init
```

## 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Production deployment

### Build

```bash
npm run build
npm start
```

### Recommended platforms
- **Vercel** (easiest — connects directly to GitHub)
- **Railway** (also provides PostgreSQL)
- **Render**

### Environment variables for production
Set all the same env vars in your platform's dashboard, and update:
- `NEXTAUTH_URL` → your production URL (e.g. `https://spliteasy.yourdomain.com`)
- Add production redirect URI in Google Cloud Console

---

## Features

| Feature | Description |
|---|---|
| Google OAuth | Sign in with Google, no passwords |
| Groups | Create groups with emoji + description |
| Add members | Invite by email (must have signed in once) |
| Expenses | Equal, exact amount, or percentage splits |
| Balances | Real-time per-person balance tracking |
| Settle up | Record payments with debt simplification algorithm |
| Delete expenses | By payer or group admin |
