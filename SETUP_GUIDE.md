# Complete Setup Guide: HisaabKitaab Backend + Analytics

This guide walks you through everything: database, backend, and analytics dashboard.

## Phase 1: Database Setup (Supabase) - 5 minutes

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up (free)
3. Create a new project:
   - **Name**: `HisaabKitaab`
   - **Region**: Choose closest to you (India: Singapore)
   - **Password**: Save this! You'll need it
4. Wait for project to initialize (2-3 minutes)

### Step 2: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy everything from `schema.sql` file
4. Paste into the editor and click "Run"
5. ✅ Tables created!

### Step 3: Get Database Credentials

1. Go to **Settings** → **Database**
2. Copy these details:
   ```
   Host: [Your host].supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [The password you set]
   ```
3. Save these for next step!

---

## Phase 2: Backend Setup (Local) - 10 minutes

### Step 1: Install Dependencies

```bash
cd ~/Developer/HisaabKitaabBackend
npm install
```

### Step 2: Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit with your credentials
nano .env
```

**Paste your Supabase details:**
```
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password-here
PORT=5000
NODE_ENV=development
JWT_SECRET=my-super-secret-analytics-key-12345
```

### Step 3: Test Backend Locally

```bash
# Start development server
npm run dev

# In another terminal, test:
curl http://localhost:5000/health

# Should return: { "status": "Backend is running" }
```

### Step 4: Register a Test User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-001",
    "email": "test@example.com"
  }'

# Should return: { "userId": 1, "message": "Device registered successfully" }
```

### Step 5: Add Test Data

```bash
# Add an expense
curl -X POST http://localhost:5000/api/data/expense \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amountRupees": 500,
    "categoryId": "food",
    "dateEpochDay": 19600
  }'

# Add more expenses (different categories)
curl -X POST http://localhost:5000/api/data/expense \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amountRupees": 2000,
    "categoryId": "transportation",
    "dateEpochDay": 19601
  }'

curl -X POST http://localhost:5000/api/data/expense \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amountRupees": 3000,
    "categoryId": "groceries",
    "dateEpochDay": 19602
  }'
```

### Step 6: Test Analytics (Your Money Maker 💰)

```bash
# Get top spending categories (aggregated data = what you sell!)
curl "http://localhost:5000/api/analytics/top-categories?aggregated=true&limit=10"

# Get spending trends
curl "http://localhost:5000/api/analytics/spending-trends?aggregated=true&monthsBack=6"

# Get consumer segments
curl "http://localhost:5000/api/analytics/segments"

# Get statistics
curl "http://localhost:5000/api/analytics/stats?aggregated=true"
```

✅ **Backend working!** Keep it running for next steps.

---

## Phase 3: Setup Analytics Dashboard (Metabase) - 15 minutes

### Option A: Cloud Version (Easiest)

1. Go to [metabase.com/cloud](https://metabase.com/cloud)
2. Click "Start a free trial"
3. Sign up
4. Click "Add database"
5. Select PostgreSQL
6. Enter Supabase credentials:
   ```
   Host: your-project.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: your-password
   SSL: ON
   ```
7. Click "Connect"
8. ✅ Connected! Skip to "Create Dashboard" below

### Option B: Self-Hosted (Docker)

```bash
# Install Docker first, then:
docker run -d -p 3000:3000 --name metabase metabase/metabase

# Visit: http://localhost:3000
# Setup account
# Add Supabase database (same steps as Option A)
```

### Create Dashboard

1. **Click "New" → "Question"**
2. **Select `expenses` table**
3. **Summarize data:**
   - Click "Summarize" 
   - Select "Count"
   - Group by "Category"
4. **Visualize:**
   - Click "Visualization" 
   - Select "Bar chart"
5. **Save as "Top Spending Categories"**

**Repeat to create:**
- Line chart: Total spending over time (Group by date)
- Pie chart: Spending by category
- Number: Total transactions
- Table: All expenses

**Quick Dashboard:**
```
Click "Dashboards" → "New Dashboard"
Add all your questions
Arrange them nicely
Set auto-refresh (every 1 hour)
```

✅ **Your Analytics Dashboard is Ready!**

---

## Phase 4: Deploy to Cloud (FREE on Render) - 20 minutes

### Step 1: Prepare GitHub

```bash
cd ~/Developer/HisaabKitaabBackend

# Initialize git
git init
git add .
git commit -m "Initial HisaabKitaab backend"

# Create GitHub repo (go to github.com → new repo)
# Copy the URL, then:
git remote add origin https://github.com/YOUR_USERNAME/hisaabkitaab-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. **Create new → Web Service**
4. Connect your GitHub repo
5. **Configure:**
   - **Name**: `hisaabkitaab-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Add Environment Variables:**
   - Click "Advanced"
   - Add all your .env variables
7. Click "Create Web Service"
8. Wait ~2 minutes...

✅ **Your backend is live!** 

Your URL: `https://hisaabkitaab-backend.onrender.com` (example)

### Step 3: Test Live Backend

```bash
# Replace with your actual URL
curl https://your-backend.onrender.com/health

curl "https://your-backend.onrender.com/api/analytics/top-categories?aggregated=true"
```

---

## Phase 5: Connect Android App (10 minutes)

### Update App to Send Data

Create new file in Android project: `ApiClient.kt`

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

const val API_BASE_URL = "https://your-backend.render.com/api/"

interface HisaabApi {
    @POST("auth/register")
    suspend fun registerDevice(@Body request: RegisterDeviceRequest): RegisterResponse
    
    @POST("data/expense")
    suspend fun syncExpense(@Body expense: ExpenseToSync): SyncResponse
    
    @POST("data/income")
    suspend fun syncIncome(@Body income: IncomeToSync): SyncResponse
    
    @GET("analytics/top-categories")
    suspend fun getTopCategories(
        @Query("aggregated") aggregated: Boolean = true,
        @Query("limit") limit: Int = 10
    ): List<CategoryStats>
}

object ApiClientBuilder {
    val apiService: HisaabApi = Retrofit.Builder()
        .baseUrl(API_BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(HisaabApi::class.java)
}

// Data classes
data class RegisterDeviceRequest(
    val deviceId: String,
    val email: String? = null
)

data class RegisterResponse(
    val userId: Int,
    val message: String
)

data class ExpenseToSync(
    val userId: Int,
    val amountRupees: Long,
    val categoryId: String,
    val dateEpochDay: Long
)

data class IncomeToSync(
    val userId: Int,
    val amountRupees: Long,
    val sourceId: String? = null,
    val customSourceLabel: String? = null,
    val dateEpochDay: Long
)

data class SyncResponse(
    val id: Int,
    val message: String
)

data class CategoryStats(
    val category_id: String,
    val transaction_count: Int,
    val total_spent: Long,
    val avg_transaction: Long
)
```

### Add Gradle Dependency

In `app/build.gradle.kts`:

```kotlin
dependencies {
    // ... existing dependencies
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
}
```

### Sync on Expense Creation

In your expense repository:

```kotlin
suspend fun addExpenseWithSync(expense: ExpenseEntity): Long {
    // Save locally first
    val localId = expenseDao.insert(expense)
    
    // Sync to backend (non-blocking)
    try {
        ApiClientBuilder.apiService.syncExpense(
            ExpenseToSync(
                userId = getUserId(), // Get from shared prefs
                amountRupees = expense.amountRupees,
                categoryId = expense.categoryId,
                dateEpochDay = expense.dateEpochDay
            )
        )
        Log.d("Sync", "Expense synced successfully")
    } catch (e: Exception) {
        Log.e("Sync", "Failed to sync expense: ${e.message}")
    }
    
    return localId
}
```

✅ **App now syncs data to backend!**

---

## 🎉 You're Done!

### Summary of what you have:

1. ✅ **PostgreSQL Database** (Supabase) - Stores all user data
2. ✅ **Backend API** (Render) - Collects & analyzes data
3. ✅ **Analytics Dashboard** (Metabase) - Visualizes insights
4. ✅ **Android Integration** - App sends data automatically

### Your Analytics Are Live At:

- **Metabase Dashboard**: http://localhost:3000 (or your Metabase Cloud URL)
- **API Endpoint**: `https://your-backend.onrender.com/api/analytics`
- **Database**: Supabase console

### Next Steps:

1. **Get more users** → More data → Better insights
2. **Add more data points** → Sync user preferences, location, etc.
3. **Create advanced reports** → Segmentation, predictions
4. **Monetize** → Sell aggregated insights to companies like Nestle

---

## Troubleshooting

### Backend won't connect to database
- Check .env credentials
- Verify SSL is enabled (Supabase requires it)
- Check Supabase network settings (allow all IPs)

### Metabase can't connect
- Verify you're using Supabase PostgreSQL credentials (not other databases)
- Enable SSL in connection settings
- Check firewall allows Metabase IP

### Android app won't sync
- Verify backend URL is correct
- Check app has internet permission
- Look at logcat for specific error

---

**Questions? Check the main README.md or API documentation!**
