FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && adduser -S node -u 1001 -G nodejs
RUN mkdir -p /app/output /app/credentials && chown -R node:nodejs /app

USER node

VOLUME ["/app/output", "/app/credentials"]

ENV TTS_OUTPUT_DIR=/app/output
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-account.json

ENTRYPOINT ["node", "dist/main.js"]
