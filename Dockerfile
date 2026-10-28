# Stage 1 - Build Dependencies
FROM node:22-alpine AS builder 
WORKDIR /app 

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci 

# Stage 2 - Hardened Production Runtime
FROM node:22-alpine AS runtime 

USER node
WORKDIR /home/node/app 

COPY --chown=node:node --from=builder /app/backend/node_modules ./backend/node_modules
COPY --chown=node:node backend/ ./backend/
COPY --chown=node:node frontend/ ./frontend/

EXPOSE 5000 
ENV NODE_ENV=production PORT=5000
WORKDIR /home/node/app/backend

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node","server.js"]