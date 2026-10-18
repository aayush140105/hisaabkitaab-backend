# Deploy the Backend — Step by Step

Everything code-side is ready (git repo committed, `render.yaml` blueprint in place). These steps need your own accounts — nobody else can click through them for you.

---

## Part 1: Supabase (Database) — 5 min

1. Go to **[supabase.com](https://supabase.com)** → sign up (free) → **New Project**
   - Name: `hisaabkitaab`
   - Database password: pick a strong one, **save it** — you'll need it below
   - Region: `Southeast Asia (Singapore)` (closest to India with a free-tier option)
2. Wait ~2 min for provisioning
3. Go to **SQL Editor** → **New query** → paste the entire contents of [`schema.sql`](schema.sql) → **Run**
4. Go to **Settings → Database** → copy these (you'll paste them into Render in Part 3):
   - **Host** (e.g. `db.xxxxxxxxxxxx.supabase.co`)
   - **Password** (the one you set in step 1)
   - Port `5432`, Database `postgres`, User `postgres` (these stay default)

---

## Part 2: Push to GitHub — 5 min

The backend is already a git repo with one commit. You just need to give it a remote:

```bash
cd ~/Developer/HisaabKitaabBackend
```

1. Go to **[github.com/new](https://github.com/new)** → create a repo named `hisaabkitaab-backend` (private is fine) → **don't** initialize with a README
2. Copy the commands GitHub shows under "…or push an existing repository", or run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/hisaabkitaab-backend.git
git branch -M main
git push -u origin main
```

---

## Part 3: Render (Hosting) — 5 min

1. Go to **[render.com](https://render.com)** → sign up with GitHub (easiest — auto-grants repo access)
2. **New +** → **Blueprint** → select the `hisaabkitaab-backend` repo
   - Render reads `render.yaml` automatically and pre-fills the service
3. It'll prompt you to fill in the `sync: false` values — paste your **Supabase** details from Part 1:
   - `DB_HOST` = your Supabase host
   - `DB_NAME` = `postgres`
   - `DB_USER` = `postgres`
   - `DB_PASSWORD` = your Supabase password
   - (`DB_PORT`, `NODE_ENV`, `JWT_SECRET` are already filled in from the blueprint)
4. Click **Apply** — Render builds and deploys (~2 min)
5. Your live URL appears at the top of the service page, e.g. `https://hisaabkitaab-backend.onrender.com`

---

## Part 4: Verify it's live

```bash
curl https://hisaabkitaab-backend.onrender.com/health
# {"status":"Backend is running"}

curl "https://hisaabkitaab-backend.onrender.com/api/analytics/top-categories?aggregated=true"
# [] (empty until real users sync data)
```

**Note:** Render's free tier spins the service down after 15 min idle — the first request after a quiet period takes ~30-50s to wake it up. Fine for now; upgrade to a paid instance ($7/mo) before you have real traffic if that cold-start matters.

---

## Part 5: Point the app at it

Already done in code — `ApiClient.kt` uses:
```kotlin
private const val PRODUCTION_URL = "https://hisaabkitaab-backend.onrender.com/api/"
```

**If your actual Render URL is different** (Render sometimes appends a suffix if the name is taken), update that one line to match, then rebuild:

```bash
cd ~/Developer/HisaabKitaab
sh gradlew :app:assembleRelease
```

Debug builds keep talking to your laptop automatically (`BuildConfig.DEBUG` switches it) — only release builds hit production.

---

## You're done

- ✅ Database: Supabase (free, Singapore region)
- ✅ Backend: Render (free tier)
- ✅ App: auto-switches between local dev and production

**Still separately needed for launch:** privacy policy hosting, Play Console setup — see the earlier summary.
