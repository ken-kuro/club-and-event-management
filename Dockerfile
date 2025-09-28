# Use Node.js LTS version 22.20.0
FROM node:22.20.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directory for SQLite database
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000


# Start the application
CMD ["npm", "start"]

