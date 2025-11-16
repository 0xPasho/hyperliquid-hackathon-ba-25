# Authentication API Documentation

## Overview

This document describes the authentication endpoints for the Scratch Editor API using Web3Auth integration.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

## Authentication Flow

### 1. User Login/Registration

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user via Web3Auth and creates or updates their account. Returns a JWT token for subsequent API calls.

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
    "idToken": "string", // Web3Auth ID token
    "walletAddress": "string", // Ethereum wallet address (0x...)
    "email": "string", // User email (optional)
    "name": "string", // User name (optional)
    "profileImage": "string", // Profile image URL (optional)
    "authProvider": "string" // "google" | "twitter" | "discord"
}
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "clx123abc",
            "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "email": "user@example.com",
            "name": "John Doe",
            "profileImage": "https://...",
            "authProvider": "google",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": "7d"
    }
}
```

**Error Responses:**

_400 Bad Request:_

```json
{
    "success": false,
    "error": "Invalid request data",
    "details": {
        "walletAddress": "Wallet address is required"
    }
}
```

_401 Unauthorized:_

```json
{
    "success": false,
    "error": "Invalid Web3Auth token"
}
```

_500 Internal Server Error:_

```json
{
    "success": false,
    "error": "Internal server error"
}
```

---

### 2. Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Returns the currently authenticated user's information.

**Request Headers:**

```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "clx123abc",
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "email": "user@example.com",
        "name": "John Doe",
        "profileImage": "https://...",
        "authProvider": "google",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Error Responses:**

_401 Unauthorized:_

```json
{
    "success": false,
    "error": "No token provided"
}
```

_403 Forbidden:_

```json
{
    "success": false,
    "error": "Invalid or expired token"
}
```

---

### 3. Get User by Wallet Address

**Endpoint:** `GET /auth/wallet/:address`

**Description:** Retrieves public user information by wallet address.

**Parameters:**

-   `address` (path parameter): Ethereum wallet address

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "clx123abc",
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "name": "John Doe",
        "profileImage": "https://...",
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Error Responses:**

_404 Not Found:_

```json
{
    "success": false,
    "error": "User not found"
}
```

---

### 4. Update User Profile

**Endpoint:** `PUT /auth/profile`

**Description:** Updates the authenticated user's profile information.

**Request Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "name": "string", // Optional
    "profileImage": "string" // Optional
}
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "clx123abc",
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "email": "user@example.com",
        "name": "Updated Name",
        "profileImage": "https://...",
        "authProvider": "google",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-02T00:00:00.000Z"
    }
}
```

---

### 5. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logs out the current user (optional endpoint for token invalidation).

**Request Headers:**

```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

---

## JWT Token Structure

The JWT token contains the following payload:

```json
{
    "userId": "clx123abc",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "iat": 1704067200,
    "exp": 1704672000
}
```

## Authentication Middleware

Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The middleware will:

1. Extract the token from the Authorization header
2. Verify the token signature
3. Check token expiration
4. Attach user information to the request object

## Error Codes

| Code | Description                                 |
| ---- | ------------------------------------------- |
| 400  | Bad Request - Invalid input data            |
| 401  | Unauthorized - No token or invalid token    |
| 403  | Forbidden - Token expired or user not found |
| 404  | Not Found - Resource not found              |
| 500  | Internal Server Error - Server error        |

## Rate Limiting

Authentication endpoints are rate-limited to prevent abuse:

-   Login: 10 requests per minute per IP
-   Get User: 60 requests per minute per user
-   Update Profile: 10 requests per minute per user

## Security Best Practices

1. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Expiration**: Tokens expire after 7 days by default
4. **Refresh Tokens**: Implement refresh token mechanism for long-lived sessions
5. **CORS**: Configure CORS to allow only trusted domains

## Example Usage

### JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        idToken: web3authIdToken,
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        email: "user@example.com",
        name: "John Doe",
        authProvider: "google",
    }),
});

const { data } = await loginResponse.json();
const { token, user } = data;

// Store token
localStorage.setItem("authToken", token);

// Get current user
const userResponse = await fetch("http://localhost:3000/api/v1/auth/me", {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const userData = await userResponse.json();
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGc...",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "email": "user@example.com",
    "name": "John Doe",
    "authProvider": "google"
  }'

# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Testing

Use the following test credentials in development:

```
Test Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Test Email: test@example.com
Test Name: Test User
```

## Support

For issues or questions:

-   GitHub Issues: [Your repo URL]
-   Documentation: [Your docs URL]
-   Email: support@yourdomain.com
