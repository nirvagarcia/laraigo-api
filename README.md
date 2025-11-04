# laraigo-api

laraigo-api is a NestJS-based API for user management.

## User Endpoints

### Create a User
- **Method:** POST
- **URL:** http://localhost:3000/users
- **Body (JSON):**
  {
    "name": "Juan"
  }

### Get All Users
- **Method:** GET
- **URL:** http://localhost:3000/users

## Setup & Run
1. Install dependencies:
   npm install
2. Start the server:
   npm run start

## Database
- Uses SQLite (file: db.sqlite)

## Features
- Create and fetch users
- Testable with Postman

## Clean Code
- No comments or unused code
- Organized structure

## Next Steps
- Extend user entity for more fields
- Add authentication

---
