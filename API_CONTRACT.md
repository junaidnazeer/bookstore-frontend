# API Contract (draft)

Shared between `bookstore-frontend` and `bookstore-backend`. Update this
together whenever an endpoint changes — don't let it drift from the real
backend code.

Base URL (local dev): `http://localhost:5000/api`

## Auth

### POST /auth/signup
Request: `{ "name": "string", "email": "string", "password": "string" }`
Response: `{ "token": "jwt-string", "user": { "id": "1", "name": "string", "email": "string" } }`

### POST /auth/login
Request: `{ "email": "string", "password": "string" }`
Response: `{ "token": "jwt-string", "user": { "id": "1", "name": "string", "email": "string" } }`

## Books

### GET /books
Query params: `?search=&page=&limit=`
Response:
```json
[
  {
    "id": "1",
    "title": "string",
    "author": "string",
    "price": 499,
    "coverUrl": "string",
    "stock": 12
  }
]
```

### GET /books/:id
Response:
```json
{
  "id": "1",
  "title": "string",
  "author": "string",
  "price": 499,
  "coverUrl": "string",
  "description": "string",
  "stock": 12
}
```

## Cart / Checkout

### POST /orders
Auth required (Bearer token).
Request:
```json
{
  "items": [{ "bookId": "1", "quantity": 2 }]
}
```
Response:
```json
{
  "orderId": "abc123",
  "totalAmount": 998,
  "razorpayOrderId": "order_xxx"
}
```

### POST /orders/:orderId/verify-payment
Called after Razorpay checkout completes on the client.
Request: `{ "razorpay_payment_id": "string", "razorpay_signature": "string" }`
Response: `{ "status": "paid" }`

### GET /orders
Auth required. Returns the logged-in user's order history.
Response:
```json
[
  { "orderId": "abc123", "totalAmount": 998, "status": "paid", "createdAt": "2026-09-07T00:00:00Z" }
]
```

---

**Note:** field names and shapes here are a starting proposal — confirm
with Murtaza before building against them, and update this file the
moment a real endpoint differs from what's written here.
