# Quick Start Guide - Cura AI

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

## 🚀 Getting Started

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create/verify .env file with required configuration
# Copy from .env.example and add your credentials
cat .env

# Start backend server
node server.js
```

**Backend will run on**: `http://localhost:5000`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Verify .env file is set correctly
cat .env

# Start frontend development server
npm run dev
```

**Frontend will run on**: `http://localhost:5173`

## ✅ Testing

### 1. Test Backend Connection
```bash
curl http://localhost:5000/healthz
```

Expected response:
```json
{
  "ok": true,
  "uptimeSec": 123,
  "timestamp": "2026-04-07T12:00:00Z",
  "requestId": "uuid"
}
```

### 2. Test Frontend
- Open `http://localhost:5173` in browser
- You should see the login page
- Dark mode toggle works in top right

### 3. Test API Integration
- Login with test credentials
- Dashboard should load real data from backend
- All API calls should work without CORS errors

## 🔧 Configuration

### Backend .env
```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
MONGO_DB=mongodb+srv://user:pass@cluster.mongodb.net/HealthBot
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=your_key
HF_API_KEY=your_key
GROQ_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000
```

## 📁 Project Structure

### Backend
- `server.js` - Main server file
- `src/routes/` - API route definitions
- `src/controllers/` - Business logic
- `src/middleware/` - Authentication & error handling
- `src/models/` - Database models
- `src/services/` - Utility services

### Frontend
- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/context/` - State management (Auth)
- `src/services/` - API integration
- `src/utils/` - Helper functions
- `src/index.css` - Global styles

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/alerts` | Get alerts |
| POST | `/api/chat` | AI chat |
| GET | `/api/data/all` | Get all disease data |
| POST | `/api/data/add` | Add disease data |
| GET | `/api/weather/:city` | Get weather data |
| GET | `/api/diseases/trending` | Trending diseases |

## 🎨 Features

- ✅ Real-time dashboard with live data
- ✅ User authentication with JWT
- ✅ AI-powered chatbot
- ✅ Disease tracking & management
- ✅ Weather integration
- ✅ Dark/Light mode
- ✅ Responsive design
- ✅ Real-time notifications
- ✅ Role-based access (Doctor/Patient)

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
# Check if port 5000 is available
# Check .env file is configured
lsof -i :5000  # Find what's using port 5000
```

### Frontend can't connect to backend
```bash
# Verify FRONTEND_ORIGIN in backend .env
# Verify VITE_API_URL in frontend .env
# Check if backend is running
# Check console for CORS errors
```

### Login not working
```bash
# Check MongoDB connection
# Verify JWT_SECRET is set in .env
# Check error logs in terminal
```

### Dark mode not working
```bash
# Check localStorage in DevTools
# Verify theme preference is saved
# Try clearing cache
```

## 📊 Database

### MongoDB Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### Collections (to be created as needed)
- `users` - User accounts
- `chatMessages` - Chat history
- `diseaseData` - Disease records
- `alerts` - System alerts
- `healthHistory` - User health records

## 🔒 Security Notes

- Never commit .env files
- Change JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Update dependencies regularly

## 📝 Available Scripts

### Backend
```bash
npm install    # Install dependencies
node server.js # Start server
npm start      # Alternative start
```

### Frontend
```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Build for production
npm run preview # Preview production build
npm run lint   # Check for linting errors
```

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

## 📞 Support

For issues or questions, check:
- `FIXES_SUMMARY.md` - Detailed fix documentation
- Backend logs in terminal
- Frontend console (DevTools)
- Browser Network tab (API requests)

---

**Last Updated**: April 7, 2026
**Status**: ✅ Ready for Production
