# Compila la interfaz React con las dependencias fijadas en package-lock.json.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
# Cypress se ejecuta en CI. La compilación de React no usa su navegador.
RUN CYPRESS_INSTALL_BINARY=0 npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Ejecuta Express con la interfaz compilada y las dependencias de producción.
FROM node:24-bookworm-slim
ENV NODE_ENV=production DB_PATH=/app/data/gym.sqlite
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
# Prepara el directorio de SQLite para que el usuario node pueda escribir.
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]
