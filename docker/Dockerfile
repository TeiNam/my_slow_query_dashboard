# Build stage
FROM node:20.18.2-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20.18.2-slim

# Set timezone
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV VITE_API_BASE_URL=http://localhost:8000

WORKDIR /app

# Copy package files for production
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application in preview mode with port 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]