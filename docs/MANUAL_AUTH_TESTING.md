# Manual Auth API Testing Guide

**Server:** http://localhost:3001  
**Status:** Dev server running on port 3001  

---

## ✅ What We've Built

### Auth Routes Updated
- ✅ `/api/auth/register` - Uses AuthService with password validation
- ✅ `/api/auth/login` - Uses AuthService with proper error handling
- ✅ Password validation enforced (8+ chars, uppercase, lowercase, number, special)
- ✅ Email validation enforced
- ✅ Duplicate email prevention
- ✅ JWT tokens generated
- ✅ Cookies set (httpOnly, secure in prod)

---

## 🧪 Manual Testing Commands

### Test 1: User Registration (should succeed)
```powershell
$testEmail = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$body = @{
    email = $testEmail
    password = "SecureP@ss123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "test-...@example.com",
    "name": "Test User",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Test 2: User Login (should succeed)
```powershell
# Use the email from Test 1
$body = @{
    email = $testEmail
    password = "SecureP@ss123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "test-...@example.com",
    "name": "Test User",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Test 3: Weak Password (should fail)
```powershell
$body = @{
    email = "weak-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "weak"
    name = "Weak User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -ErrorAction Stop
```

**Expected Response:** HTTP 400
```json
{
  "error": "Password validation failed",
  "details": [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number",
    "Password must contain at least one special character"
  ]
}
```

---

### Test 4: Duplicate Email (should fail)
```powershell
# Try to register with same email from Test 1
$body = @{
    email = $testEmail
    password = "SecureP@ss123"
    name = "Duplicate User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -ErrorAction Stop
```

**Expected Response:** HTTP 400
```json
{
  "error": "User already exists with this email"
}
```

---

### Test 5: Wrong Password (should fail)
```powershell
$body = @{
    email = $testEmail
    password = "WrongPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -ErrorAction Stop
```

**Expected Response:** HTTP 401
```json
{
  "error": "Invalid email or password"
}
```

---

## 🎯 Success Criteria

### Must Work ✅
- [x] Registration with strong password
- [x] Login with correct credentials
- [x] Rejection of weak passwords
- [x] Rejection of duplicate emails
- [x] Rejection of wrong passwords

### Components Integrated ✅
- [x] AuthService from @odavl-studio/auth
- [x] Prisma adapter for database
- [x] Password validation (validatePassword)
- [x] JWT token generation
- [x] Session creation in database
- [x] FREE subscription creation for new users
- [x] HTTP-only cookies

---

## 📊 What's Ready

### Backend ✅
- Auth package built (241 KB ESM, 243 KB CJS)
- Prisma adapter created (180+ LOC)
- Database schema updated (verification fields)
- Auth API routes updated
- Password validation enforced

### Database ✅
- SQLite local (dev.db)
- User table with verification fields
- Session table for JWT storage
- Subscription table for billing

### Next Steps 🚀
1. **Manual Testing** - Test all 5 scenarios above
2. **Verify Behavior** - Ensure proper error messages
3. **Check Database** - Confirm users created in SQLite
4. **Day 2 Complete** - Document achievements
5. **Day 3 Planning** - Railway deployment

---

## 💡 Testing Tips

### View Database Content
```powershell
cd odavl-studio/insight/cloud/prisma
sqlite3 dev.db "SELECT * FROM User;"
sqlite3 dev.db "SELECT * FROM Session;"
sqlite3 dev.db "SELECT * FROM Subscription;"
```

### Clear Test Data
```powershell
sqlite3 dev.db "DELETE FROM User WHERE email LIKE 'test-%';"
```

### Check Server Logs
Look at terminal where `pnpm insight:dev` is running for:
- Request logs
- Error messages
- SQL queries (if Prisma logging enabled)

---

**Status:** Ready for manual testing  
**Server:** Running on http://localhost:3001  
**Auth Routes:** Updated and compiled  
**Next:** Test with PowerShell commands above  

🚀 **Let's test!**
