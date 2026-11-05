# JYNTRA AI — Dockerfile (multi-stage build)
# Stage 1: Build frontend assets with Vite
FROM node:20.19.0-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production runtime — serve API + built frontend
FROM node:20.19.0-alpine AS runner

WORKDIR /app

# ffmpeg is required by the Muse Voice Transcribe pipeline (WAV/PCM 16 kHz
# mono conversion). Without it the audio route cannot run in the container.
RUN apk add --no-cache ffmpeg

# Create non-privileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 jyntra

# Copy only production needs from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
# server.ts and src/ are the actual API runtime: omitting them produced an
# image that started and crashed immediately on the missing entrypoint.
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env.example ./.env.example

# Install only production dependencies
RUN npm ci --omit=dev

USER jyntra

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
