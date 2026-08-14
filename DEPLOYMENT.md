# Deployment Guide: Render + Supabase

Deploy your HisaabKitaab backend to production (FREE tier).

## Prerequisites

- ✅ GitHub account
- ✅ Render account (sign up at render.com)
- ✅ Supabase database running (from SETUP_GUIDE.md)
- ✅ Backend code ready locally

## Step 1: Prepare GitHub Repository

### Initialize Git (if not done already)

```bash
cd ~/Developer/HisaabKitaabBackend

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: HisaabKitaab backend with analytics"
```

### Push to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Create new repository: `hisaabkitaab-backend`
3. Don't add README/License (we already have them)

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/hisaabkitaab-backend.git

# Rename branch to main
git branch -M main

# Push code
git push -u origin main
```

✅ Your code is on GitHub!

---

## Step 2: Deploy on Render

### 1. Sign into Render

Go to [render.com](https://render.com)
- Sign up with GitHub (easier)
- Authorize Render to access your repos

### 2. Create Web Service

Click **"New +"** → **"Web Service"**

```
Select repository: hisaabkitaab-backend
Branch: main
```

### 3. Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `hisaabkitaab-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `production` |

### 4. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add all variables from your `.env`:

```
DB_HOST = your-project.supabase.co
DB_PORT = 5432
DB_NAME = postgres
DB_USER = postgres
DB_PASSWORD = your-password-here
PORT = 5000
NODE_ENV = production
JWT_SECRET = your-super-secret-key
```

⚠️ **Make sure to use your actual Supabase credentials!**

### 5. Deploy

Click **"Create Web Service"**

Render will:
1. Download code from GitHub
2. Install dependencies
3. Start the server
4. Assign you a free URL

⏱️ **Wait 2-3 minutes** for deployment to complete

### 6. Check Deployment

In Render dashboard:
- Green checkmark = ✅ Deployment successful
- Red error = ❌ Check logs

**Your live URL:** `https://hisaabkitaab-backend.onrender.com` (example)

---

## Step 3: Test Live Backend

### Health Check

```bash
curl https://hisaabkitaab-backend.onrender.com/health
```

Response:
```json
{"status": "Backend is running"}
```

### Test Registration

```bash
curl -X POST https://your-backend-url.render.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-prod-001",
    "email": "test@example.com"
  }'
```

Should return:
```json
{"userId": 1, "message": "Device registered successfully"}
```

### Test Analytics

```bash
curl "https://your-backend-url.render.com/api/analytics/top-categories?aggregated=true&limit=5"
```

✅ **Backend is live!**

---

## Step 4: Update Android App

Update the API URL in your Android app:

File: `app/src/main/java/com/example/hisaabkitaab/network/ApiClient.kt`

```kotlin
object ApiClient {
    private const val BASE_URL = "https://your-backend-url.onrender.com/api/"
    
    val instance: HisaabApi by lazy {
        // ... rest of code
    }
}
```

Replace `your-backend-url` with your actual Render URL.

---

## Monitoring & Logs

### View Logs in Render

1. Open Render dashboard
2. Select `hisaabkitaab-backend` service
3. Click **"Logs"** tab
4. See real-time logs as requests come in

```
INFO: Device registered successfully
INFO: Expense synced: 1
ERROR: Failed to connect to database
```

### Monitor API Usage

The **free tier on Render**:
- ✅ Unlimited requests
- ✅ Shared CPU
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ ~500 hours/month max (plenty for your use case)

Upgrade to **$7/month** if you get heavy usage.

---

## Troubleshooting

### "Build failed"

Check logs in Render. Common issues:
- Wrong environment variables
- Missing dependencies
- Database connection error

**Fix:**
```bash
# Check locally first
npm install
npm start

# Should work locally before deploying
```

### "Service crashed"

1. Check logs for error message
2. Usually a database connection issue
3. Verify Supabase credentials are correct

**Fix:**
```bash
# Test database locally
node -e "const db = require('./db'); console.log('Connected!')"
```

### "Connection timeout" from app

If Android app can't reach backend:
1. Verify URL is correct
2. Add to `network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-backend-url.onrender.com</domain>
    </domain-config>
</network-security-config>
```

---

## Manual Deployment Updates

Every time you update code:

```bash
cd ~/Developer/HisaabKitaabBackend

# Make changes
# Edit files...

# Commit
git add .
git commit -m "Add new analytics endpoint"

# Push
git push origin main
```

Render will **automatically redeploy** when you push to `main` branch.

---

## Scaling Up (Optional)

When you need better performance:

### Option 1: Render Paid Plan
```
Click "Settings" → "Modify" → Choose paid tier
$7/month = better performance
```

### Option 2: Custom Domain
```
Go to "Settings" → "Custom Domains"
Add: analytics.hisaabkitaab.com (if you have domain)
```

### Option 3: Database
Supabase free tier should handle:
- 100 users: ✅ No problem
- 1000 users: ✅ Still fine
- 10k+ users: Consider upgrade to paid

---

## Backup & Data Management

### Automatic Backups (Supabase)

Supabase automatically backs up your database daily.

To export data:

```bash
# Via Supabase console:
# 1. Go to SQL Editor
# 2. Create query: SELECT * FROM expenses;
# 3. Download CSV
```

---

## Security Best Practices

### 1. Change JWT Secret

✅ Already in `.env` as `JWT_SECRET`

### 2. Enable SSL (Automatic)

Render provides free SSL/HTTPS automatically.

### 3. Rotate Supabase Password

```bash
# In Supabase > Settings > Database
# Click "Reset password"
# Update in Render environment variables
```

### 4. Limit API Access (Future)

Add rate limiting to prevent abuse:

```kotlin
// Install: npm install express-rate-limit
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## Cost Summary

| Service | Cost | Why |
|---------|------|-----|
| **Supabase** | FREE (up to 500MB) | Database |
| **Render** | FREE | Backend server |
| **Metabase** | FREE | Analytics dashboard |
| **GitHub** | FREE | Code hosting |
| **Total** | **$0** 🎉 | Scales up to 10k+ users |

---

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test with curl
3. ✅ Update Android app URL
4. ✅ Start sending data
5. ✅ View analytics in Metabase
6. 📊 Analyze insights!

---

**Your analytics backend is live! 🚀**

Need help? Check Render logs or Supabase docs.
