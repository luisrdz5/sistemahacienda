# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Crear usuario no-root primero
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Instalar dependencias primero (mejor cache de Docker)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Exponer puerto
EXPOSE 3001

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["node", "src/app.js"]
