# Imagem de produção do front (Next.js standalone). O ambiente é escolhido no build, porque as NEXT_PUBLIC_* são
# gravadas no bundle: docker build --build-arg APP_ENV=hml .  (prod | hml | azl; padrão: prod)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
# O postinstall copia o runtime WASM do OCR para public/ocr/ort, então os scripts não podem ser ignorados.
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG APP_ENV=prod
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/public/ocr/ort ./public/ocr/ort
COPY . .
RUN npm run build:${APP_ENV}

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
