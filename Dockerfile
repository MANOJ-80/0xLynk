FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/signaling-server/package*.json ./apps/signaling-server/
RUN npm ci

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY apps ./apps
COPY docs ./docs
COPY scripts ./scripts
EXPOSE 8080
CMD ["npm", "run", "start:signaling:prod"]
