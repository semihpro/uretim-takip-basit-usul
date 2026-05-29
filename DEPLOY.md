# Üretim Takip MiniMax - Deployment

## Coolify Deployment

### Gereksinimler
- Coolify kurulu bir sunucu
- Git repository bağlantısı veya dosya yükleme

### Adımlar

#### 1. Coolify'da Yeni Uygulama Oluştur

1. Coolify dashboard'a gir
2. "New Resource" > "Application" seç
3. Git repository'yi bağla veya dosyaları yükle

#### 2. Environment Variables Ayarla

Coolify'da şu environment variable'ları ayarla:

| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `POSTGRES_PASSWORD` | `secure_password_123` | PostgreSQL şifresi |
| `POSTGRES_USER` | `uretim_admin` | Veritabanı kullanıcı adı |
| `POSTGRES_DB` | `uretim_minimax` | Veritabanı adı |
| `JWT_SECRET` | `random_secret_key_32_chars` | JWT için gizli anahtar |

#### 3. Docker Compose ile Deploy

**Yöntem 1: Docker Compose (Önerilen)**

Coolify'da "Docker Compose" tipinde deployment oluştur:

```yaml
# docker-compose.coolify.yml dosyasını kullan
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      PORT: 4000
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Yöntem 2: Ayrı Deploy (Her servis için)**

Her servis için ayrı application oluştur:
1. `backend` - Backend API (port 4000)
2. `frontend` - Next.js (port 3000)
3. `db` - PostgreSQL (port 5432)

#### 4. Veritabanı Migrate

Backend container'ında çalıştır:

```bash
npx prisma migrate deploy
npx prisma generate
npx tsx src/scripts/seed.ts
```

#### 5. Test Et

- Frontend: `http://sunucu-ip:3000`
- Backend: `http://sunucu-ip:4000`

Login: `admin@uretimtakip.com` / `UretimAdmin2026!`

---

## Manuel Docker Deployment (Docker Compose)

```bash
# Environment dosyası oluştur
cp backend/.env.example backend/.env
# .env dosyasını düzenle

# Deploy
docker-compose -f docker-compose.yml up -d

# Veritabanı migrate
docker exec uretimtakip-backend npx prisma migrate deploy
docker exec uretimtakip-backend npx prisma generate
```

---

## Portlar

| Servis | Port | URL |
|--------|------|-----|
| Frontend | 3000 | http://sunucu:3000 |
| Backend | 4000 | http://sunucu:4000 |
| PostgreSQL | 5432 | localhost:5432 |

---

## Önemli Notlar

1. **JWT_SECRET** - Güvenli bir değer kullan (en az 32 karakter)
2. **POSTGRES_PASSWORD** - Güvenli bir şifre kullan
3. **.env dosyaları** - Production'da asla commit edilmemeli
4. **Volume'lar** - Veritabanı verileri kalıcı olmalı