#!/bin/bash
set -e

DOMAIN="lahacienda.online"
EMAIL="admin@lahacienda.online"

echo "=========================================="
echo "  Configuracion SSL para $DOMAIN"
echo "=========================================="

# Crear directorio para certbot
sudo mkdir -p /var/www/certbot

# Detener nginx si esta corriendo
echo "Deteniendo contenedores..."
cd ~/hacienda
sudo docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Crear configuracion temporal de nginx (solo HTTP)
echo "Creando configuracion temporal de nginx..."
cat > /tmp/nginx-temp.conf << 'NGINXCONF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name lahacienda.online www.lahacienda.online;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'SSL setup in progress...';
            add_header Content-Type text/plain;
        }
    }
}
NGINXCONF

# Copiar config temporal
sudo cp /tmp/nginx-temp.conf ~/hacienda/nginx/nginx.conf

# Levantar solo nginx temporalmente
echo "Iniciando nginx temporal..."
sudo docker run -d --name nginx-temp \
    -p 80:80 \
    -v ~/hacienda/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v /var/www/certbot:/var/www/certbot \
    nginx:alpine

# Esperar a que nginx este listo
sleep 3

# Obtener certificado
echo "Obteniendo certificado SSL..."
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

# Detener nginx temporal
echo "Deteniendo nginx temporal..."
sudo docker stop nginx-temp
sudo docker rm nginx-temp

# Restaurar configuracion completa con SSL
echo "Restaurando configuracion SSL completa..."
cd ~/hacienda
git checkout nginx/nginx.conf

# Levantar todos los contenedores
echo "Iniciando aplicacion con SSL..."
sudo docker compose -f docker-compose.prod.yml up -d --build

# Configurar renovacion automatica
echo "Configurando renovacion automatica..."
(sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker exec hacienda_nginx nginx -s reload'") | sudo crontab -

echo ""
echo "=========================================="
echo "  SSL Configurado exitosamente!"
echo "=========================================="
echo ""
echo "Tu sitio esta disponible en:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo ""
echo "El certificado se renovara automaticamente."
echo ""
