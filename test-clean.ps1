Write-Host "🧹 Clean Laraigo API - Testing Simplified Architecture" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

try {
    # Test GET /users
    Write-Host "🔍 Testing GET /users..." -ForegroundColor Cyan
    $users = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Get
    Write-Host "✅ Retrieved $($users.length) users" -ForegroundColor Green
    
    if ($users.length -gt 0) {
        Write-Host "Users:" -ForegroundColor Yellow
        foreach ($user in $users) {
            Write-Host "  - ID: $($user.id), Name: $($user.name), Email: $($user.email)" -ForegroundColor White
        }
    }
    Write-Host ""
    
    # Test POST /users  
    Write-Host "📝 Testing POST /users..." -ForegroundColor Cyan
    $newUser = @{
        name = "Test User Clean"
        email = "test.clean@example.com"
    } | ConvertTo-Json
    
    $createdUser = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -ContentType "application/json" -Body $newUser
    Write-Host "✅ Created user: ID $($createdUser.id) - $($createdUser.name)" -ForegroundColor Green
    Write-Host ""
    
    # Test GET specific user
    Write-Host "🔍 Testing GET /users/$($createdUser.id)..." -ForegroundColor Cyan
    $singleUser = Invoke-RestMethod -Uri "http://localhost:3000/users/$($createdUser.id)" -Method Get
    Write-Host "✅ Retrieved user: $($singleUser.name) ($($singleUser.email))" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🎉 Clean Architecture Test Complete!" -ForegroundColor Green
    Write-Host "✅ User Module: WORKING" -ForegroundColor Green
    Write-Host "✅ SQLite Database: WORKING" -ForegroundColor Green
    Write-Host "✅ Prisma Service: WORKING" -ForegroundColor Green
    Write-Host "✅ Simple Structure: ACHIEVED" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test Error: $($_.Exception.Message)" -ForegroundColor Red
}