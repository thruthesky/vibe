# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run stage ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
# build 결과 + package.json + prod deps만
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

# SvelteKit adapter-node 기본 포트(원하면 바꿔도 됨)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
