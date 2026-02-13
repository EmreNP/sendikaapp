# Build stage
FROM node:20-bullseye-slim AS builder
WORKDIR /workspace

# Copy backend and shared into workspace so relative "file:../shared" dependency resolves
COPY api/backend /workspace/backend
COPY shared /workspace/shared

WORKDIR /workspace/backend
RUN npm install --no-audit --no-fund --prefer-offline

# Ensure shared monorepo folder is resolvable via node module path
RUN mkdir -p node_modules \
    && ln -s /workspace/shared node_modules/@shared || true \
    && ln -s /workspace/shared node_modules/shared || true

# Build
RUN npm run build

# Production stage
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# Copy necessary files from builder
COPY --from=builder /workspace/backend/package*.json ./
COPY --from=builder /workspace/backend/.next ./.next
COPY --from=builder /workspace/backend/node_modules ./node_modules
COPY --from=builder /workspace/backend/next.config.js ./next.config.js

# NOT: Service account key dosyası build sırasında değil, 
# Cloud Run'da secret olarak mount edilmeli veya
# GOOGLE_APPLICATION_CREDENTIALS_JSON env variable ile enjekte edilmeli

EXPOSE 8080
CMD ["npm", "start"]