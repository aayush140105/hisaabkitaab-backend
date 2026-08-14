# Quick Start Checklist

Get your analytics backend running in 30 minutes.

## 🚀 Phase 1: Database (5 min)

- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Create account and new project
- [ ] Copy `schema.sql` content
- [ ] Paste in Supabase SQL Editor → Run
- [ ] Save credentials (Host, Password)

**Your DB is ready!** ✅

---

## 💻 Phase 2: Backend (10 min)

```bash
# Navigate
cd ~/Developer/HisaabKitaabBackend

# Install
npm install

# Setup config
cp .env.example .env
# Edit .env with your Supabase credentials

# Run
npm run dev
```

### Test it:
```bash
curl http://localhost:5000/health
# Returns: {"status": "Backend is running"}
```

**Backend running locally!** ✅

---

## 📊 Phase 3: Analytics Dashboard (5 min)

- [ ] Go to [metabase.com/cloud](https://metabase.com/cloud) (free trial)
- [ ] Create account
- [ ] Click "Add Database" → PostgreSQL
- [ ] Enter Supabase credentials
- [ ] Create sample dashboard

**Dashboard ready!** ✅

---

## 🚀 Phase 4: Deploy to Cloud (5 min)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/hisaabkitaab-backend
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Create Web Service from `hisaabkitaab-backend` repo
   - Add environment variables (from .env)
   - Deploy!

**Live URL:** `https://your-backend.onrender.com` ✅

---

## 📱 Phase 5: Connect Android App (5 min)

1. **Get backend URL** from Render dashboard
2. **Update Android project:**
   - Add Retrofit dependency to `build.gradle`
   - Create `ApiClient.kt` (see ANDROID_INTEGRATION.md)
   - Create `SyncManager.kt` (see ANDROID_INTEGRATION.md)
   - Update repositories to call sync
3. **Rebuild app**
4. **Test!**

**App syncing data!** ✅

---

## 📋 Essential Commands

```bash
# Start local backend
cd ~/Developer/HisaabKitaabBackend
npm run dev

# Test endpoints
curl http://localhost:5000/api/analytics/top-categories?aggregated=true

# Register test device
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-001"}'

# Add test expense
curl -X POST http://localhost:5000/api/data/expense \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"amountRupees":500,"categoryId":"food","dateEpochDay":19600}'

# Get analytics
curl "http://localhost:5000/api/analytics/top-categories?aggregated=true"
curl "http://localhost:5000/api/analytics/segments"
curl "http://localhost:5000/api/analytics/stats?aggregated=true"
```

---

## 📚 Full Documentation

| Guide | Purpose |
|-------|---------|
| [README.md](README.md) | Overview & features |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Detailed step-by-step setup |
| [ANDROID_INTEGRATION.md](ANDROID_INTEGRATION.md) | App integration code |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |

---

## 🎯 What You Built

✅ **PostgreSQL Database** (Supabase)  
✅ **Backend API** (Node.js + Express)  
✅ **Analytics Engine** (Advanced SQL queries)  
✅ **Free Hosting** (Render)  
✅ **Analytics Dashboard** (Metabase)  
✅ **Android Integration** (Ready to sync data)  

---

## 💡 Key API Endpoints (Aggregated Data = Insights You Sell)

```
GET  /api/analytics/top-categories?aggregated=true
     → What products people buy most

GET  /api/analytics/segments
     → Customer segmentation (high/med/low spenders)

GET  /api/analytics/spending-trends?aggregated=true
     → Spending trends over time

GET  /api/analytics/income-sources?aggregated=true
     → Income source breakdown

GET  /api/analytics/category-heatmap?aggregated=true
     → Spending patterns by category & month
```

---

## ✨ Your Analytics Business Model

1. **Users install HisaabKitaab app**
2. **App syncs their spending data to your backend**
3. **You analyze aggregated data** (anonymized)
4. **Sell insights to companies** like:
   - FMCG brands (Nestle, etc.)
   - Retail companies
   - Banks & fintech
   - Market researchers

**Data you can sell:**
- Top categories people spend in
- Regional spending patterns
- Income vs expense trends
- Consumer segmentation
- Seasonal buying patterns

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check .env has DB_HOST and DB_PASSWORD |
| Can't connect to database | Verify Supabase credentials, enable SSL |
| App can't reach backend | Update API_BASE_URL in ApiClient.kt |
| Analytics showing no data | Make sure app synced expenses first |
| Metabase won't connect | Use PostgreSQL driver, enable SSL, check IP |

---

## 🔗 Useful Links

- Supabase Dashboard: [app.supabase.com](https://app.supabase.com)
- Render Dashboard: [dashboard.render.com](https://dashboard.render.com)
- Metabase Setup: [metabase.com/docs](https://metabase.com/docs)
- Retrofit Docs: [square.github.io/retrofit](https://square.github.io/retrofit)

---

## 🎉 You're Ready!

```
Phase 1 (DB):     ✅ 5 min
Phase 2 (Backend): ✅ 10 min
Phase 3 (Analytics): ✅ 5 min
Phase 4 (Deploy):  ✅ 5 min
Phase 5 (Android): ✅ 5 min
────────────────────────
Total Time:       ✅ 30 min
```

**Start from Phase 1 or jump to SETUP_GUIDE.md for detailed instructions.**

---

Happy analyzing! 📊🚀
