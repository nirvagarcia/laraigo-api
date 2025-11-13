# laraigo-api

laraigo-api is a NestJS-based API for user management.

## User Endpoints

### Create a User
- **Method:** POST
- **URL:** http://localhost:3000/users
- **Body (JSON):**
  {
    "name": "Juan",
    "email": "juan@example.com"
  }

### Get All Users
- **Method:** GET
- **URL:** http://localhost:3000/users

### Get User by ID
- **Method:** GET
- **URL:** http://localhost:3000/users/:id

### Update User
- **Method:** PUT
- **URL:** http://localhost:3000/users/:id
- **Body (JSON):**
  {
    "name": "Updated Name",
    "email": "newemail@example.com"
  }

### Delete User
- **Method:** DELETE
- **URL:** http://localhost:3000/users/:id

## Setup & Run
1. Install dependencies:
   npm install
2. Start the server:
   npm run start

## Database
- Uses SQLite (file: db.sqlite)

## Features
- Full CRUD operations for users with optional email field
- Comprehensive input validation with class-validator
- Required and optional parameter validation
- Custom error classes with proper HTTP status codes
- Global error handling and exception filtering
- Granular Pino structured logging with request context
- Rate limiting and throttling protection
- Database error handling with Prisma
- Detailed validation error responses
- Forbidden field detection and error reporting
- IP tracking and audit logging
- Testable with Postman

## Validation Rules
- **Name:** Required, 2-50 characters, string type
- **Email:** Optional, valid email format when provided
- **Extra Fields:** Forbidden - returns error if present

## Rate Limits
- Create User: 10 requests per minute
- Get All Users: 50 requests per minute  
- Get User by ID: 30 requests per minute
- Update User: 5 requests per minute
- Delete User: 3 requests per minute
- Global limit: 100 requests per minute

## Clean Code
- No comments or unused code
- Organized structure

## Next Steps
- Extend user entity for more fields
- Add authentication

---

npm run start
npm run start:dev
http://localhost:3000/
npx prisma studio

## Prerequisites

Ensure the following are installed on your system:
- **Node.js** (v16 or higher)
- **Docker** (for Redis)
- **npm** (Node Package Manager)

---

## Steps to Start the Project

### 1. Install Dependencies
```bash
npm install

### 2. Start Redis
```bash
docker start redis-laraigo

-> if -> docker run -d -p 6379:6379 --name redis-laraigo redis:latest

3. Start the Development Server
npm run start:dev
