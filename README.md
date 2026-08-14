# HisaabKitaab Analytics Backend

A Node.js Express backend for collecting and analyzing financial data from the HisaabKitaab Android app. Provides APIs for data ingestion and advanced analytics queries designed for market research and consumer behavior insights.

## Features

✅ **User Management** - Device-based registration and tracking  
✅ **Data Ingestion** - Collect expenses, income, and savings goals  
✅ **Advanced Analytics** - Spending patterns, trends, and consumer segmentation  
✅ **Aggregated Insights** - Anonymous aggregate data for market research  
✅ **Free Stack** - Supabase (PostgreSQL) + Render (Node.js)  

## Quick Start

### 1. Setup Database (Supabase - FREE)

```bash
# Go to https://supabase.com
# 1. Sign up and create a new project
# 2. Go to SQL Editor and paste content from schema.sql
# 3. Copy your database credentials from Settings > Database
```

**Your Supabase credentials:**
- **Host**: `your-project.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Check your email/dashboard

### 2. Setup Backend (Local Development)

```bash
# 1. Navigate to backend directory
cd ~/Developer/HisaabKitaabBackend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env with your Supabase credentials
# DB_HOST=your-project.supabase.co
# DB_PASSWORD=your-password
# JWT_SECRET=your-super-secret-key

# 5. Run the server
npm run dev
```

**Server will start at:** `http://localhost:5000`

### 3. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Register a device
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device-123","email":"user@example.com"}'

# Add an expense
curl -X POST http://localhost:5000/api/data/expense \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "amountRupees": 500,
    "categoryId": "food",
    "dateEpochDay": 19600
  }'

# Get top spending categories (aggregated)
curl "http://localhost:5000/api/analytics/top-categories?aggregated=true&limit=10"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new device
- `GET /api/auth/user/:deviceId` - Get user info

### Data Ingestion
- `POST /api/data/expense` - Record an expense
- `POST /api/data/income` - Record income
- `POST /api/data/savings-goal` - Create savings goal
- `POST /api/data/savings-contribution` - Add savings contribution
- `GET /api/data/expenses/:userId` - Get all expenses for user
- `GET /api/data/income/:userId` - Get all income for user

### Analytics (★ Most Important)
- `GET /api/analytics/top-categories?aggregated=true` - Top spending categories (MARKET INSIGHT)
- `GET /api/analytics/spending-trends?aggregated=true` - Spending trends over time
- `GET /api/analytics/segments` - Consumer segmentation (high/medium/low spenders)
- `GET /api/analytics/income-sources?aggregated=true` - Income source analysis
- `GET /api/analytics/stats?aggregated=true` - Overall statistics
- `GET /api/analytics/category-heatmap?aggregated=true` - Spending by category & month

### Query Parameters

**For analytics endpoints:**
- `aggregated=true` - Get anonymized aggregate data (across all users) - Use this for selling insights
- `aggregated=false&userId=1` - Get individual user data
- `limit=10` - Limit results (default: 10)
- `monthsBack=6` - Historical data (default: 6 months)

## Deployment (FREE on Render)

### 1. Deploy Backend

```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/hisaabkitaab-backend
git push -u origin main

# 2. Go to https://render.com (free tier)
# 3. Create new Web Service
# 4. Connect GitHub repo
# 5. Set Build Command: npm install
# 6. Set Start Command: npm start
# 7. Add environment variables from .env
# 8. Deploy!
```

**Your backend URL:** `https://your-service.render.com`

### 2. Setup Analytics with Metabase (FREE)

```bash
# 1. Go to https://www.metabase.com/start/oss/
# 2. Download and run Metabase locally OR
# 3. Use Metabase Cloud (free tier): https://metabase.com/

# 4. Connect to Supabase:
#    - Click "Add Database"
#    - Choose PostgreSQL
#    - Enter Supabase credentials
#    - Save

# 5. Create dashboards:
#    - New > Question
#    - Select expenses table
#    - Summarize by category, date, etc.
#    - Visualize as charts
```

## Integration with Android App

### 1. Add API Client to App

Create `ApiClient.kt`:

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private const val BASE_URL = "https://your-backend-url/api/"
    
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}
```

### 2. Create API Interface

```kotlin
import retrofit2.http.*

interface HisaabApi {
    @POST("auth/register")
    suspend fun registerDevice(@Body request: RegisterRequest): RegisterResponse
    
    @POST("data/expense")
    suspend fun addExpense(@Body expense: ExpenseRequest): AddResponse
    
    @GET("analytics/top-categories")
    suspend fun getTopCategories(
        @Query("aggregated") aggregated: Boolean = true,
        @Query("limit") limit: Int = 10
    ): List<CategoryStats>
}
```

### 3. Sync Data from App

```kotlin
// In your Repository
suspend fun syncExpenseToBackend(expense: ExpenseEntity) {
    try {
        val request = ExpenseRequest(
            userId = getCurrentUserId(),
            amountRupees = expense.amountRupees,
            categoryId = expense.categoryId,
            dateEpochDay = expense.dateEpochDay
        )
        apiClient.addExpense(request)
    } catch (e: Exception) {
        Log.e("Sync", "Failed to sync: ${e.message}")
    }
}
```

## Example Analytics Queries

### What products/categories do people spend most on?
```bash
curl "https://your-backend.render.com/api/analytics/top-categories?aggregated=true&limit=20"
```

**Response:**
```json
[
  {
    "category_id": "food_groceries",
    "transaction_count": 15234,
    "total_spent": 125000000,
    "avg_transaction": 8200
  },
  {
    "category_id": "transportation",
    "transaction_count": 8900,
    "total_spent": 95000000,
    "avg_transaction": 10674
  }
]
```

### Consumer Segmentation
```bash
curl "https://your-backend.render.com/api/analytics/segments"
```

**Response:**
```json
[
  {
    "segment": "High Spender",
    "user_count": 234,
    "avg_total_spent": 850000,
    "avg_transactions": 45
  },
  {
    "segment": "Medium Spender",
    "user_count": 1245,
    "avg_total_spent": 250000,
    "avg_transactions": 22
  }
]
```

## Environment Variables

```
DB_HOST=your-supabase.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

## File Structure

```
HisaabKitaabBackend/
├── server.js                 # Main Express app
├── db.js                      # Database connection
├── schema.sql                 # PostgreSQL schema
├── package.json
├── .env.example
└── routes/
    ├── auth.js               # User registration
    ├── data.js               # Data ingestion
    └── analytics.js          # Analytics queries
```

## Roadmap

- [ ] User authentication with JWT
- [ ] Rate limiting
- [ ] Data export (CSV/JSON)
- [ ] Advanced segmentation
- [ ] Predictive analytics
- [ ] Mobile app dashboard

## Support

For questions or issues, create an issue in your GitHub repo.

## License

MIT
