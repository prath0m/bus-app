# School Bus Payment Tracker - Backend Setup

This backend provides MongoDB integration for the School Bus Payment Tracker React Native app.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with default values. For production, update these variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/school-bus-tracker

# Server Configuration
PORT=3000

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Expiration
JWT_EXPIRES_IN=7d
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
Update `MONGODB_URI` in `.env` with your Atlas connection string.

### 4. Start the Backend Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user  
- `POST /api/auth/verify` - Verify JWT token

### User Management

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users` - Get all users (admin only)

### Health Check

- `GET /api/health` - Server health status

## API Request Examples

### Signup
```json
POST /api/auth/signup
{
  "firstName": "Vijay",
  "lastName": "Bhuva", 
  "email": "vijaybhuva90@gmail.com",
  "mobileNumber": "+919876543210",
  "password": "securepassword",
  "busRoute": "Route A"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "vijaybhuva90@gmail.com",
  "password": "securepassword"
}
```

## Database Schema

### User Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  mobileNumber: String (required),
  password: String (required, hashed),
  busRoute: String,
  OwnerId: String (unique),
  role: String (enum: ['owner', 'parent', 'admin']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Helmet.js for security headers
- CORS configuration
- Environment variable protection

## React Native Integration

The React Native app automatically connects to this backend using the API service located at `src/services/api.ts`.

### Development
- API calls use `http://localhost:3000/api`

### Production
- Update `API_BASE_URL` in `src/services/api.ts`

## Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","mobileNumber":"+919876543210","password":"password123"}'

# Login  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `JWT_SECRET` to a secure random string
3. Use MongoDB Atlas or secure MongoDB instance
4. Configure proper CORS origins
5. Use PM2 or similar for process management
6. Set up reverse proxy with Nginx
7. Enable HTTPS/SSL certificates

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity for Atlas

### API Connection from React Native
- Ensure backend server is running
- Check network connectivity
- Verify API_BASE_URL in React Native app
- Use device IP instead of localhost for physical devices

## File Structure

```
backend/
├── models/
│   └── User.js          # User data model
├── routes/
│   ├── auth.js          # Authentication routes
│   └── users.js         # User management routes
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── server.js           # Express server setup
└── README.md           # This file
```