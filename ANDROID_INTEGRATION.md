# Android App Integration Guide

This guide explains how to integrate the HisaabKitaab Android app with the backend to sync data.

## Overview

Your Android app currently stores data locally using Room database. We'll add:
1. API calls to register the device
2. Automatic sync of expenses/income to the backend
3. Ability to pull analytics back to the app (optional)

## Step 1: Add Dependencies

### Update `app/build.gradle.kts`

```kotlin
dependencies {
    // ... existing dependencies
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    
    // Coroutines (for async sync)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

Then sync gradle.

## Step 2: Create API Models

Create file: `app/src/main/java/com/example/hisaabkitaab/network/ApiModels.kt`

```kotlin
package com.example.hisaabkitaab.network

import com.google.gson.annotations.SerializedName

// Request Models
data class RegisterDeviceRequest(
    @SerializedName("deviceId")
    val deviceId: String,
    @SerializedName("email")
    val email: String? = null
)

data class ExpenseToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("amountRupees")
    val amountRupees: Long,
    @SerializedName("categoryId")
    val categoryId: String,
    @SerializedName("dateEpochDay")
    val dateEpochDay: Long
)

data class IncomeToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("amountRupees")
    val amountRupees: Long,
    @SerializedName("sourceId")
    val sourceId: String? = null,
    @SerializedName("customSourceLabel")
    val customSourceLabel: String? = null,
    @SerializedName("dateEpochDay")
    val dateEpochDay: Long
)

data class SavingsGoalToSync(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("name")
    val name: String,
    @SerializedName("emoji")
    val emoji: String,
    @SerializedName("targetRupees")
    val targetRupees: Long? = null,
    @SerializedName("targetMonthYear")
    val targetMonthYear: String? = null,
    @SerializedName("isGeneral")
    val isGeneral: Boolean = false
)

// Response Models
data class RegisterResponse(
    @SerializedName("userId")
    val userId: Int,
    @SerializedName("message")
    val message: String
)

data class SyncResponse(
    @SerializedName("id")
    val id: Int,
    @SerializedName("message")
    val message: String
)

// Analytics Models
data class CategoryStats(
    @SerializedName("category_id")
    val categoryId: String,
    @SerializedName("transaction_count")
    val transactionCount: Int,
    @SerializedName("total_spent")
    val totalSpent: Long,
    @SerializedName("avg_transaction")
    val avgTransaction: Long
)

data class ConsumerSegment(
    @SerializedName("segment")
    val segment: String,
    @SerializedName("user_count")
    val userCount: Int,
    @SerializedName("avg_total_spent")
    val avgTotalSpent: Long
)

data class SpendingTrend(
    @SerializedName("month")
    val month: String,
    @SerializedName("total_spent")
    val totalSpent: Long,
    @SerializedName("transaction_count")
    val transactionCount: Int
)
```

## Step 3: Create API Service Interface

Create file: `app/src/main/java/com/example/hisaabkitaab/network/HisaabApi.kt`

```kotlin
package com.example.hisaabkitaab.network

import retrofit2.http.*

interface HisaabApi {
    
    // ============ Authentication ============
    @POST("auth/register")
    suspend fun registerDevice(
        @Body request: RegisterDeviceRequest
    ): RegisterResponse

    @GET("auth/user/{deviceId}")
    suspend fun getUser(
        @Path("deviceId") deviceId: String
    ): RegisterResponse

    // ============ Data Ingestion ============
    @POST("data/expense")
    suspend fun syncExpense(
        @Body expense: ExpenseToSync
    ): SyncResponse

    @POST("data/income")
    suspend fun syncIncome(
        @Body income: IncomeToSync
    ): SyncResponse

    @POST("data/savings-goal")
    suspend fun syncSavingsGoal(
        @Body goal: SavingsGoalToSync
    ): SyncResponse

    @GET("data/expenses/{userId}")
    suspend fun getExpenses(
        @Path("userId") userId: Int
    ): List<ExpenseToSync>

    // ============ Analytics ============
    @GET("analytics/top-categories")
    suspend fun getTopCategories(
        @Query("aggregated") aggregated: Boolean = true,
        @Query("limit") limit: Int = 10
    ): List<CategoryStats>

    @GET("analytics/spending-trends")
    suspend fun getSpendingTrends(
        @Query("aggregated") aggregated: Boolean = true,
        @Query("monthsBack") monthsBack: Int = 6
    ): List<SpendingTrend>

    @GET("analytics/segments")
    suspend fun getConsumerSegments(): List<ConsumerSegment>

    @GET("analytics/stats")
    suspend fun getStats(
        @Query("aggregated") aggregated: Boolean = true
    ): Map<String, Any>
}
```

## Step 4: Create API Client

Create file: `app/src/main/java/com/example/hisaabkitaab/network/ApiClient.kt`

```kotlin
package com.example.hisaabkitaab.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    
    // Change this to your deployed backend URL
    private const val BASE_URL = "https://your-backend.onrender.com/api/"
    
    // For local testing:
    // private const val BASE_URL = "http://192.168.1.X:5000/api/"
    
    val instance: HisaabApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(HisaabApi::class.java)
    }
}
```

**Important**: Update `BASE_URL` to your actual backend URL after deployment.

For local testing on Android emulator:
```kotlin
private const val BASE_URL = "http://10.0.2.2:5000/api/" // Emulator's host loopback
```

For local testing on physical device:
```kotlin
private const val BASE_URL = "http://192.168.1.X:5000/api/" // Your laptop's local IP
```

## Step 5: Create Sync Manager

Create file: `app/src/main/java/com/example/hisaabkitaab/sync/SyncManager.kt`

```kotlin
package com.example.hisaabkitaab.sync

import android.content.Context
import android.util.Log
import com.example.hisaabkitaab.network.ApiClient
import com.example.hisaabkitaab.network.RegisterDeviceRequest
import com.example.hisaabkitaab.network.ExpenseToSync
import com.example.hisaabkitaab.network.IncomeToSync
import com.example.hisaabkitaab.network.SavingsGoalToSync
import kotlinx.coroutines.*

class SyncManager(private val context: Context) {
    
    private val apiService = ApiClient.instance
    private val TAG = "SyncManager"
    
    fun registerDevice(deviceId: String, email: String? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = RegisterDeviceRequest(deviceId, email)
                val response = apiService.registerDevice(request)
                
                // Save userId to SharedPreferences
                val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
                prefs.edit().putInt("userId", response.userId).apply()
                
                Log.d(TAG, "Device registered. UserId: ${response.userId}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to register device: ${e.message}")
            }
        }
    }
    
    fun syncExpense(
        amountRupees: Long,
        categoryId: String,
        dateEpochDay: Long
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) {
                    Log.w(TAG, "User not registered yet")
                    return@launch
                }
                
                val expense = ExpenseToSync(
                    userId = userId,
                    amountRupees = amountRupees,
                    categoryId = categoryId,
                    dateEpochDay = dateEpochDay
                )
                
                val response = apiService.syncExpense(expense)
                Log.d(TAG, "Expense synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync expense: ${e.message}")
                // In production, you'd want to queue failed syncs and retry
            }
        }
    }
    
    fun syncIncome(
        amountRupees: Long,
        sourceId: String? = null,
        customSourceLabel: String? = null,
        dateEpochDay: Long
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) return@launch
                
                val income = IncomeToSync(
                    userId = userId,
                    amountRupees = amountRupees,
                    sourceId = sourceId,
                    customSourceLabel = customSourceLabel,
                    dateEpochDay = dateEpochDay
                )
                
                val response = apiService.syncIncome(income)
                Log.d(TAG, "Income synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync income: ${e.message}")
            }
        }
    }
    
    fun syncSavingsGoal(
        name: String,
        emoji: String,
        targetRupees: Long? = null,
        targetMonthYear: String? = null,
        isGeneral: Boolean = false
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val userId = getUserId()
                if (userId <= 0) return@launch
                
                val goal = SavingsGoalToSync(
                    userId = userId,
                    name = name,
                    emoji = emoji,
                    targetRupees = targetRupees,
                    targetMonthYear = targetMonthYear,
                    isGeneral = isGeneral
                )
                
                val response = apiService.syncSavingsGoal(goal)
                Log.d(TAG, "Savings goal synced: ${response.id}")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync savings goal: ${e.message}")
            }
        }
    }
    
    private fun getUserId(): Int {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        return prefs.getInt("userId", -1)
    }
}
```

## Step 6: Update Repositories to Sync Data

### Update ExpenseRepository

```kotlin
// In your existing ExpenseRepository or create new one
class ExpenseRepositoryImpl(
    private val expenseDao: ExpenseDao,
    private val context: Context
) : ExpenseRepository {
    
    private val syncManager = SyncManager(context)
    
    override suspend fun insertExpense(expense: ExpenseEntity): Long {
        // Save to local database
        val localId = expenseDao.insertExpense(expense)
        
        // Sync to backend asynchronously
        syncManager.syncExpense(
            amountRupees = expense.amountRupees,
            categoryId = expense.categoryId,
            dateEpochDay = expense.dateEpochDay
        )
        
        return localId
    }
}
```

## Step 7: Update App Container (Dependency Injection)

Update your `AppContainer.kt` to provide SyncManager:

```kotlin
class AppContainer(context: Context) {
    // ... existing dependencies
    
    val syncManager: SyncManager by lazy {
        SyncManager(context)
    }
}
```

## Step 8: Initialize Sync on App Launch

Update `HisaabKitaabApplication.kt` or `MainActivity.kt`:

```kotlin
class HisaabKitaabApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Get or create device ID
        val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        // Register device with backend
        val syncManager = SyncManager(this)
        syncManager.registerDevice(deviceId)
    }
}
```

## Step 9: Add Internet Permission

In `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 10: Test the Integration

```kotlin
// In your MainActivity or a test screen
val syncManager = SyncManager(context)

// Register
syncManager.registerDevice("test-device-001", "user@example.com")

// Sync an expense
syncManager.syncExpense(
    amountRupees = 500,
    categoryId = "food",
    dateEpochDay = 19600
)

// Check logs
// Should see: "Expense synced: 1"
```

## Troubleshooting

### Connection refused error
- Make sure backend is running
- Check URL is correct
- For local testing, use `http://10.0.2.2:5000` (emulator) or `http://192.168.1.X:5000` (device)

### SSL certificate error
- Using Render or HTTPS? Should work automatically
- If self-signed certificate, add to network security config

### Data not appearing in backend
- Check `logcat` for sync errors
- Verify `userId` is being saved correctly
- Check backend logs: `heroku logs` or Render dashboard

### Want to view analytics in app?

Add this to your UI code:

```kotlin
class AnalyticsViewModel(private val context: Context) : ViewModel() {
    
    private val _topCategories = MutableLiveData<List<CategoryStats>>()
    val topCategories: LiveData<List<CategoryStats>> = _topCategories
    
    fun loadTopCategories() {
        viewModelScope.launch {
            try {
                val stats = ApiClient.instance.getTopCategories(
                    aggregated = false, // Get user's own data
                    limit = 10
                )
                _topCategories.postValue(stats)
            } catch (e: Exception) {
                Log.e("Analytics", "Failed to load: ${e.message}")
            }
        }
    }
}
```

## Next Steps

1. Update `BASE_URL` in `ApiClient.kt` to your deployed backend
2. Add internet permission to manifest
3. Update repositories to call `syncManager`
4. Test with a few expenses
5. Monitor backend logs to see data flowing in
6. View data in Metabase dashboard

---

**Your app is now connected to the backend! 🎉**
