FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && mkdir -p logs uploads \
    && chown node:node logs uploads

COPY --chown=node:node src ./src

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health', { signal: AbortSignal.timeout(2000) }).then(async (res) => { await res.arrayBuffer(); if (!res.ok) process.exitCode = 1 }).catch(() => { process.exitCode = 1 })"]

CMD ["node", "src/server.js"]
