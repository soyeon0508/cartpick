# User Authentication API

## Overview

This API provides email/password-based authentication for users with JWT tokens and refresh token rotation.

**Base URL**: `http://localhost:3000/api/v1/auth`

**Token Storage Strategy (MVP)**: 
- Access tokens and refresh tokens are stored in `localStorage` (or `sessionStorage` for better security)
- Refresh tokens are sent in the request body (not in headers or cookies)
- Note: Future improvement may switch to httpOnly cookies for refresh tokens

---

## Authentication Flow

```
1. Signup/Login → Get access token + refresh token
2. Store both tokens in localStorage/sessionStorage
3. Use access token in Authorization header (Bearer token)
4. When access token expires → Use refresh endpoint to get new tokens
5. Logout → Revoke refresh token
6. Logout-all → Revoke all refresh tokens for the user
```

---

## Endpoints

### 1. Sign Up

Creates a new user account with email and password.

**Endpoint**: `POST /api/v1/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "nickname": "john_doe"
}
```

**Validation Rules**:
- `email`: Valid email format, max 255 characters
- `password`: 8-100 characters
- `nickname`: 2-30 characters, Korean letters, English letters, numbers, and underscores only (`^[가-힣a-zA-Z0-9_]+$`)

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "john_doe",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "base64url-encoded-random-token",
      "accessExpiresIn": "30m",
      "refreshExpiresAt": "2026-06-18T06:39:59.000Z"
    }
  }
}
```

**Error Responses**:
- `409 Conflict`: Email or nickname already exists
  ```json
  {
    "success": false,
    "error": "Email already exists"
    // or "Nickname already exists"
  }
  ```
- `400 Bad Request`: Invalid input format

---

### 2. Login

Authenticates a user with email and password.

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "john_doe",
      "status": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "base64url-encoded-random-token",
      "accessExpiresIn": "30m",
      "refreshExpiresAt": "2026-06-18T06:39:59.000Z"
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid email or password
  ```json
  {
    "success": false,
    "error": "Invalid credentials"
  }
  ```
- `401 Unauthorized`: User is not active (suspended or withdrawn)

---

### 3. Get Current User

Get the current authenticated user's information.

**Endpoint**: `GET /api/v1/auth/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "john_doe",
    "profileImage": "https://example.com/profile.jpg",
    "status": "active"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing, invalid, or expired access token

---

### 4. Refresh Token

Rotates the refresh token and issues a new access token.

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "base64url-encoded-random-token"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new-base64url-encoded-random-token",
    "accessExpiresIn": "30m",
    "refreshExpiresAt": "2026-06-18T06:39:59.000Z"
  }
}
```

**Important Notes**:
- The old refresh token is automatically revoked after use (refresh token rotation)
- The response includes a **new** refresh token (not the same as the one sent)
- Store the new tokens and replace the old ones in storage

**Error Responses**:
- `401 Unauthorized`: Invalid, expired, or revoked refresh token
  ```json
  {
    "success": false,
    "error": "Invalid refresh token"
  }
  ```
- `401 Unauthorized`: User is not active

---

### 5. Logout

Revokes the current refresh token (logout from current device).

**Endpoint**: `POST /api/v1/auth/logout`

**Request Body**:
```json
{
  "refreshToken": "base64url-encoded-random-token"
}
```

**Success Response** (204 No Content):
- Empty response body

**Error Responses**:
- No error returned even if token is already invalid (idempotent)

---

### 6. Logout All

Revokes all refresh tokens for the authenticated user (logout from all devices).

**Endpoint**: `POST /api/v1/auth/logout-all`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (204 No Content):
- Empty response body

**Error Responses**:
- `401 Unauthorized`: Missing, invalid, or expired access token

---

## Token Details

### Access Token

- **Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Expiration**: 30 minutes (configurable via `USER_ACCESS_EXPIRY`)
- **Usage**: Sent in `Authorization` header as `Bearer <access_token>`
- **Payload**:
  ```json
  {
    "sub": 1,        // User ID
    "role": "user",  // User role
    "iat": 1716100000,
    "exp": 1716101800
  }
  ```

### Refresh Token

- **Type**: Random base64url-encoded token (48 bytes)
- **Expiration**: 30 days (configurable via `USER_REFRESH_EXPIRY_DAYS`)
- **Usage**: Sent in request body
- **Security**: Stored as SHA-256 hash in database
- **Rotation**: Automatically rotated on each refresh call (old token revoked, new token issued)

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `400 Bad Request`: Invalid request format or validation errors
- `401 Unauthorized`: Authentication failed or token invalid
- `409 Conflict`: Resource already exists (email/nickname)
- `500 Internal Server Error`: Server error

---

## Security Notes

1. **Password Storage**: Passwords are hashed using Argon2id (memory-hard hashing algorithm)
2. **Token Rotation**: Refresh tokens are rotated on each use to prevent token reuse attacks
3. **Token Expiration**: Both access and refresh tokens have expiration times
4. **User Status**: Suspended or withdrawn users cannot authenticate
5. **Rate Limiting**: Not implemented yet (planned for production)

---

## Frontend Integration Example

```typescript
// Signup
const signup = async (email: string, password: string, nickname: string) => {
  const response = await fetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  });
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('access_token', data.data.tokens.accessToken);
  localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
  
  return data;
};

// Make authenticated request
const fetchWithAuth = async (url: string) => {
  const accessToken = localStorage.getItem('access_token');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  // Handle token expiration
  if (response.status === 401) {
    await refreshAccessToken();
    // Retry request with new token
    return fetchWithAuth(url);
  }
  
  return response.json();
};

// Refresh access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json();
  
  // Update stored tokens
  localStorage.setItem('access_token', data.data.accessToken);
  localStorage.setItem('refresh_token', data.data.refreshToken);
};

// Logout
const logout = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  // Clear tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
```

---

## Testing

Run the E2E tests:

```bash
cd cartpick/apps/api
pnpm test:e2e user-auth
```

Tests cover:
- ✅ Signup with valid credentials
- ✅ Duplicate email detection
- ✅ Duplicate nickname detection
- ✅ Email validation
- ✅ Password length validation
- ✅ Login with valid credentials
- ✅ Login with wrong email
- ✅ Login with wrong password
- ✅ Get current user with valid token
- ✅ Get current user without token
- ✅ Get current user with invalid token
- ✅ Refresh token rotation
- ✅ Refresh with invalid token
- ✅ Logout token revocation
- ✅ Logout-all token revocation

---

## Future Improvements

1. **Rate Limiting**: Add rate limiting for login attempts to prevent brute force attacks
2. **httpOnly Cookies**: Move refresh tokens to httpOnly cookies for better security
3. **Email Verification**: Add email verification flow after signup
4. **Password Reset**: Add password reset functionality
5. **Account Deletion**: Add account deletion endpoint
6. **Social Login**: Add Kakao and Apple login (Post-MVP)