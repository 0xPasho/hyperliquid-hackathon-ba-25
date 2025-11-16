# Scratch GUI Dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Skip husky install in Docker (git hooks not needed)
ENV HUSKY=0

# Copy root package files
COPY package*.json ./

# Copy ALL workspace packages (scratch-gui depends on them)
COPY packages/scratch-svg-renderer ./packages/scratch-svg-renderer
COPY packages/scratch-render ./packages/scratch-render
COPY packages/scratch-vm ./packages/scratch-vm
COPY packages/scratch-gui ./packages/scratch-gui

# Install dependencies from ROOT (monorepo context)
RUN npm install --legacy-peer-deps

# Explicitly install peer dependencies (--legacy-peer-deps skips them)
RUN npm install react@16.14.0 react-dom@16.14.0 react-redux@5.1.2 redux@3.7.2 --legacy-peer-deps

# Switch to scratch-gui directory for build
WORKDIR /app/packages/scratch-gui

# Build arguments for environment variables (with production defaults)
ARG API_URL=https://api.degu.games/api/v1
ARG ASSET_HOST=https://studio.degu.games
ENV API_URL=$API_URL
ENV ASSET_HOST=$ASSET_HOST

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY packages/scratch-gui/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/packages/scratch-gui/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
