# AWS Cognito Authentication API

## 🎯 Complete Email-Based Authentication with Verification

Your backend now has **TWO** authentication systems:
1. `/auth/*` - Old JWT auth (for existing test users)
2. `/cognito-auth/*` - **NEW AWS Cognito** (email + verification codes)

---

## 📧 Cognito Auth Endpoints

### 1. Register New User
```http
POST http://localhost:4000/cognito-auth/register

Body:
{
  "email": "user@example.com",
  "password": "MyPass123",
  "name": "John Doe",
  "phone": "+919876543210",  // optional
  "role": "CUSTOMER"          // optional, default: CUSTOMER
}

Response (201):
{
  "message": "User registered successfully. Please check your email for verification code.",
  "userId": "uuid-here",
  "emailVerificationRequired": true
}
```

**✅ User receives verification code via email!**

---

### 2. Verify Email
```http
POST http://localhost:4000/cognito-auth/verify-email

Body:
{
  "email": "user@example.com",
  "code": "123456"  // Code from email
}

Response (200):
{
  "message": "Email verified successfully. You can now login."
}
```

---

### 3. Resend Verification Code
```http
POST http://localhost:4000/cognito-auth/resend-code

Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Verification code sent to your email"
}
```

---

### 4. Login
```http
POST http://localhost:4000/cognito-auth/login

Body:
{
  "email": "user@example.com",
  "password": "MyPass123"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+919876543210",
    "role": "CUSTOMER"
  },
  "token": "eyJraWQiOiJ...",      // Access token
  "idToken": "eyJraWQiOiJ...",    // ID token
  "refreshToken": "eyJjdHki..."   // Refresh token
}

Error (403) - Email not verified:
{
  "error": "Please verify your email first",
  "emailVerificationRequired": true
}
```

---

### 5. Forgot Password
```http
POST http://localhost:4000/cognito-auth/forgot-password

Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Password reset code sent to your email"
}
```

**✅ User receives reset code via email!**

---

### 6. Reset Password
```http
POST http://localhost:4000/cognito-auth/confirm-forgot-password

Body:
{
  "email": "user@example.com",
  "code": "123456",           // Code from email
  "newPassword": "NewPass123"
}

Response (200):
{
  "message": "Password reset successfully. You can now login."
}
```

---

## 🔐 Password Requirements

- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 number
- No special characters required

---

## 📱 Frontend Integration Example

### Registration Flow
```typescript
// 1. Register
const registerResponse = await axios.post('http://localhost:4000/cognito-auth/register', {
  email: 'user@example.com',
  password: 'MyPass123',
  name: 'John Doe',
  role: 'CUSTOMER'
});

// 2. Show verification code input screen

// 3. Verify email
await axios.post('http://localhost:4000/cognito-auth/verify-email', {
  email: 'user@example.com',
  code: verificationCode
});

// 4. Navigate to login
```

### Login Flow
```typescript
const loginResponse = await axios.post('http://localhost:4000/cognito-auth/login', {
  email: 'user@example.com',
  password: 'MyPass123'
});

const { user, token, idToken, refreshToken } = loginResponse.data;

// Store tokens
await SecureStore.setItemAsync('accessToken', token);
await SecureStore.setItemAsync('idToken', idToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// Navigate based on role
if (user.role === 'CUSTOMER') {
  navigation.navigate('CustomerHome');
} else if (user.role === 'STORE_OWNER') {
  navigation.navigate('StoreOwnerDashboard');
}
```

### Forgot Password Flow
```typescript
// 1. Request reset code
await axios.post('http://localhost:4000/cognito-auth/forgot-password', {
  email: 'user@example.com'
});

// 2. Show code + new password input

// 3. Reset password
await axios.post('http://localhost:4000/cognito-auth/confirm-forgot-password', {
  email: 'user@example.com',
  code: resetCode,
  newPassword: 'NewPass123'
});

// 4. Navigate to login
```

---

## ✅ What's Working

- ✅ Email-based registration
- ✅ Email verification with codes
- ✅ Email verification code resend
- ✅ Login with email + password
- ✅ Forgot password flow
- ✅ Password reset with codes
- ✅ User data stored in RDS PostgreSQL
- ✅ AWS Cognito manages authentication
- ✅ 50,000 MAUs free tier

---

## 🎉 Your App is Ready!

**Backend running:** http://localhost:4000

**Test it:**
1. Register a new user with your email
2. Check your email for verification code
3. Verify email
4. Login
5. Start using your marketplace! 🚀
