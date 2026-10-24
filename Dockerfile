# Stage 1: Install dependencies and build the application
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


# Stage 2: Install only production dependencies
FROM node:24-alpine AS production-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional --ignore-scripts


#stage 3: Run the application
FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/src/lib/server/generated/prisma ./src/lib/server/generated/prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "build"]
