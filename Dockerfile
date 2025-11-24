# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# ---- run stage ----
FROM node:20-alpine
WORKDIR /app

# Install pnpm in production image
RUN npm install -g pnpm

ENV NODE_ENV=production

# Copy build results and package files
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# SvelteKit adapter-node default port
ENV PORT=3000
EXPOSE 3000

CMD ["node", "build"]
