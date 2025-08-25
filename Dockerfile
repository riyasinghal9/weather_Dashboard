# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway/Render will override with their own PORT)
EXPOSE $PORT
EXPOSE 5001
EXPOSE 8080

# Note: Railway handles health checks automatically, so we don't need HEALTHCHECK

# Start the application
CMD ["npm", "start"] 