# Weather Dashboard

A comprehensive weather dashboard application that provides current weather conditions and 5-day forecasts for multiple cities. Built with a modern React frontend and robust Express.js backend.

## 🌟 Features

### Core Features
- **Current Weather Display**: Real-time weather conditions including temperature, humidity, wind speed, pressure, and more
- **5-Day Forecast**: Detailed weather predictions with daily highs/lows and conditions
- **Multi-City Support**: Add, remove, and manage multiple cities in your dashboard
- **Smart Caching**: Intelligent data caching to minimize API calls and improve performance
- **Responsive Design**: Beautiful, mobile-first design that works on all devices
- **Real-time Updates**: Auto-refresh weather data every 5 minutes

### Technical Features
- **RESTful API**: Well-structured backend with comprehensive error handling
- **Database Integration**: SQLite database for user preferences and caching
- **Rate Limiting**: API protection against abuse
- **Error Boundaries**: Graceful error handling in the frontend
- **Loading States**: Smooth loading animations and states
- **Optimistic Updates**: Immediate UI updates for better user experience

## 🛠 Tech Stack

### Frontend
- **React 18** with hooks and modern patterns
- **Vite** for fast development and building
- **Tailwind CSS** for styling and responsive design
- **React Query** for state management and caching
- **Lucide React** for beautiful icons
- **Axios** for API communication
- **date-fns** for date formatting

### Backend
- **Node.js** with Express.js framework
- **SQLite** database with automatic setup
- **OpenWeatherMap API** integration
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection
- **Compression** for response optimization

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **OpenWeatherMap API Key** (free at [openweathermap.org](https://openweathermap.org/api))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd weather-dashboard
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install:all
```

### 3. Environment Setup

Create environment files:

```bash
# Backend environment
cp backend/env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# OpenWeatherMap API Configuration
OPENWEATHER_API_KEY=your_api_key_here
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cache Configuration (in minutes)
WEATHER_CACHE_DURATION=30
FORECAST_CACHE_DURATION=180
```

### 4. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to the API keys section
4. Copy your API key
5. Add it to your `.env` file

### 5. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
weather-dashboard/
├── backend/                 # Express.js backend
│   ├── config/             # Database configuration
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML template
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md              # This file
```

## 🔌 API Documentation

### Base URL
`http://localhost:5000/api`

### Weather Endpoints

#### Get Current Weather
```http
GET /weather/current/:lat/:lon
```

**Parameters:**
- `lat` (number): Latitude
- `lon` (number): Longitude

**Response:**
```json
{
  "success": true,
  "data": {
    "location": { "name": "London", "country": "GB" },
    "weather": { "main": "Clear", "description": "clear sky" },
    "temperature": { "current": 22, "feelsLike": 25 },
    "details": { "humidity": 65, "pressure": 1013 }
  }
}
```

#### Get 5-Day Forecast
```http
GET /weather/forecast/:lat/:lon
```

#### Get Complete Weather Data
```http
GET /weather/complete/:lat/:lon
```

#### Search Cities
```http
GET /weather/search/:query?limit=5
```

### Cities Endpoints

#### Get User Cities
```http
GET /cities
```

#### Add City
```http
POST /cities
Content-Type: application/json

{
  "name": "London",
  "country": "GB",
  "lat": 51.5074,
  "lon": -0.1278
}
```

#### Remove City
```http
DELETE /cities/:id
```

#### Get Cities with Weather
```http
GET /cities/with-weather
```

### Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## 🎨 UI Components

### Main Components

- **Header**: App title, refresh button, and add city action
- **CityList**: Sidebar with user's cities and quick weather info
- **WeatherDisplay**: Main weather information with current conditions and forecast
- **AddCityModal**: Search and add new cities interface

### Utility Components

- **LoadingSpinner**: Reusable loading indicator
- **ErrorBoundary**: Error handling wrapper

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Production
npm run build           # Build frontend for production
npm start              # Start production server

# Dependencies
npm run install:all     # Install all dependencies
```

### Database Schema

The application uses SQLite with the following tables:

#### user_cities
- `id`: Primary key
- `name`: City name
- `country`: Country code
- `lat`: Latitude
- `lon`: Longitude
- `added_at`: Timestamp

#### weather_cache
- `id`: Primary key
- `city_key`: Unique cache key
- `current_weather`: JSON data
- `forecast_data`: JSON data
- `cached_at`: Cache timestamp
- `expires_at`: Expiration timestamp

#### api_usage
- `id`: Primary key
- `endpoint`: API endpoint
- `timestamp`: Request timestamp
- `ip_address`: Client IP
- `response_time`: Response time in ms

## 🚢 Deployment

### Backend Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: SQLite database will be created automatically
3. **API Key**: Ensure OpenWeatherMap API key is configured
4. **Port**: Application will use PORT environment variable or default to 5000

### Frontend Deployment

1. **Build**: Run `npm run build` in the frontend directory
2. **Static Files**: Deploy the `dist` folder to your hosting service
3. **API URL**: Update API base URL for production

### Deployment Platforms

#### Railway (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy with automatic builds

#### Vercel (Frontend)
1. Import project from GitHub
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`

#### Heroku
1. Add Node.js buildpack
2. Set environment variables
3. Ensure `package.json` has correct start script

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
OPENWEATHER_API_KEY=your_production_api_key
FRONTEND_URL=https://your-frontend-domain.com
WEATHER_CACHE_DURATION=30
FORECAST_CACHE_DURATION=180
```

## 🤖 AI Tools Used

This project was developed with assistance from AI tools:

1. **Claude (Anthropic)**: Primary development assistant for:
   - Architecture planning and design decisions
   - Code generation and implementation
   - Error handling strategies
   - Documentation writing
   - Best practices guidance

2. **AI-Assisted Development Process**:
   - Iterative development with AI feedback
   - Code review and optimization suggestions
   - Testing strategy recommendations
   - Performance optimization insights

## 📝 Assumptions Made

1. **API Usage**: Assumes reasonable API usage limits with OpenWeatherMap free tier
2. **User Storage**: Uses local browser storage patterns, no user authentication
3. **Data Persistence**: SQLite database for simplicity, easily upgradeable to PostgreSQL
4. **Caching Strategy**: 30-minute cache for current weather, 3-hour cache for forecasts
5. **Error Handling**: Graceful degradation when weather services are unavailable
6. **Responsive Design**: Mobile-first approach with tablet and desktop optimization
7. **Browser Support**: Modern browsers with ES6+ support
8. **Network Conditions**: Handles offline/poor connectivity scenarios

## ⚠️ Known Limitations

1. **API Rate Limits**: OpenWeatherMap free tier limits (60 calls/minute, 1000 calls/day)
2. **Data Accuracy**: Weather data accuracy depends on OpenWeatherMap service
3. **Offline Support**: Limited offline functionality, requires internet for weather updates
4. **User Sessions**: No user authentication, cities are shared across all users
5. **Database Scaling**: SQLite suitable for small-scale deployment
6. **Real-time Updates**: 5-minute auto-refresh interval (not true real-time)
7. **Geolocation**: No automatic location detection, manual city addition only
8. **Historical Data**: No historical weather data, only current and 5-day forecast

## 🔮 Future Improvements

### Short-term Enhancements
- **User Authentication**: Individual user accounts and preferences
- **Geolocation API**: Automatic current location detection
- **Weather Alerts**: Severe weather notifications
- **Data Export**: Export weather data to CSV/JSON
- **Dark Mode**: Theme switching capability

### Medium-term Features
- **Weather Maps**: Interactive weather maps integration
- **Historical Data**: Weather history and trends
- **Weather Comparisons**: Side-by-side city comparisons
- **Mobile App**: React Native mobile application
- **Push Notifications**: Weather alerts and updates

### Long-term Vision
- **Machine Learning**: Personalized weather insights
- **IoT Integration**: Smart home device connectivity
- **Advanced Analytics**: Weather pattern analysis
- **API Monetization**: Premium features and API access
- **Multi-language Support**: Internationalization

## 🐛 Troubleshooting

### Common Issues

#### API Key Issues
```bash
# Error: Invalid API key
# Solution: Check your OpenWeatherMap API key in .env file
```

#### Port Conflicts
```bash
# Error: Port 5000 already in use
# Solution: Change PORT in backend/.env or kill existing process
lsof -ti:5000 | xargs kill -9
```

#### Database Issues
```bash
# Error: Database locked
# Solution: Restart the application, database will reinitialize
```

#### CORS Issues
```bash
# Error: CORS policy
# Solution: Check FRONTEND_URL in backend/.env matches your frontend URL
```

### Development Tips

1. **API Testing**: Use tools like Postman or curl to test API endpoints
2. **Database Inspection**: Use SQLite browser to inspect database contents
3. **Logging**: Check browser console and server logs for detailed errors
4. **Cache Clearing**: Clear browser cache if experiencing stale data

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, please:
1. Check the troubleshooting section
2. Review existing issues on GitHub
3. Create a new issue with detailed error information
4. Include environment details and steps to reproduce

---

**Built with ❤️ using modern web technologies and AI assistance** 