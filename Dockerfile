# Build the web app, then run the API — which also serves the built site.
FROM node:22-slim AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci --no-audit --no-fund
COPY web ./
RUN npm run build

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server ./
COPY --from=web /app/web/dist /app/web/dist

# SQLite lives on a mounted disk in production (DATA_DIR=/data)
EXPOSE 4000
CMD ["node", "src/index.js"]
