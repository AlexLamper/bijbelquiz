# 🚨 CRITICAL FIXES FOR PRODUCTION (VERCEL)

You are seeing these errors because **local configuration files like `.env.local` are NOT uploaded to Vercel**. You must configure the production environment manually.

## STEP 1: Fix Database Access (IP Whitelist)
**Error:** `MongooseServerSelectionError ... IP that isn't whitelisted`

Vercel servers use dynamic IP addresses. You must allow ALL IP addresses to connect to your database.

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Go to **Network Access** in the left sidebar.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (This adds `0.0.0.0/0`).
5. Click **Confirm**. 
   * *Wait 1-2 minutes for this to propagate.*

## STEP 2: Add Environment Variables to Vercel
**Error:** `Please define the MONGODB_URI environment variable`

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click on your project (`bijbelquiz`).
3. Go to **Settings** > **Environment Variables**.
4. Add the following keys (copy values from your local `.env.local`):

| Key | Value Source |
|-----|--------------|
| `MONGODB_URI` | Copy from `.env.local` |
| `NEXTAUTH_SECRET` | Copy from `.env.local` |
| `NEXTAUTH_URL` | Your real domain (e.g. `https://your-app.vercel.app`) |

## STEP 3: Redeploy
1. After changing Step 1 and Step 2, go to the **Deployments** tab in Vercel.
2. Click the three dots `...` on the latest deployment and choose **Redeploy**.
3. This ensures the new variables are picked up.

---

## Why "Access Denied"?
The "Access Denied" error happens because NextAuth tries to look up the user in the database, but the database connection fails (due to Step 1). Once Step 1 & 2 are fixed, login will work.
