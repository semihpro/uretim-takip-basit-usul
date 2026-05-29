FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Copy .env if exists
COPY .env* .env 2>/dev/null || true

# Expose port
EXPOSE 4000

# Start
CMD ["npm", "run", "dev"]