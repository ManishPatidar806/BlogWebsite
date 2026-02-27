# SSL Certificates

This directory is for SSL certificates in production.

## Development

For development, SSL is not required. The application runs on HTTP.

## Production

For production, you need SSL certificates. Options:

### Option 1: Let's Encrypt (Recommended)

Use Certbot to obtain free SSL certificates:

```bash
# Install certbot
sudo apt install certbot

# Obtain certificates (replace yourdomain.com)
sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Copy or symlink to this directory
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./fullchain.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./privkey.pem
```

### Option 2: Self-Signed (Testing Only)

Generate self-signed certificates for testing:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Required Files

- `fullchain.pem` - Certificate chain
- `privkey.pem` - Private key

## Security

⚠️ **Never commit SSL certificates to version control!**

The `.gitignore` is configured to exclude `*.pem`, `*.key`, and `*.crt` files.
