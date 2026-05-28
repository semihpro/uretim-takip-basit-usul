# Uretim Takip MiniMax - Backend

Node.js + TypeScript + Express + Prisma Backend API

## Kurulum

```bash
cd backend
npm install
```

## Veritabanı

```bash
# Cihazda yeni veritabanı oluştur
createdb uretim_minimax -U postgres

# Prisma setup
npm run db:generate  # Generate client
npm run db:push      # Push schema to DB
npm run db:migrate   # Run migrations (optional)

# Seed data
npx tsx src/scripts/seed.ts
```

## Çalıştırma

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /health | Health check |
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/login-badge | Badge/PIN login |
| GET | /api/auth/me | Get current user |
| GET | /api/products | List products |
| GET | /api/products/tree | Product tree view |
| GET | /api/products/:id | Get product detail |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| POST | /api/products/:id/routes | Add route to product |
| GET | /api/workstations | List workstations |
| POST | /api/workstations | Create workstation |
| POST | /api/workstations/seed-defaults | Seed default stations |
| GET | /api/orders | List orders |
| GET | /api/orders/:id | Get order detail |
| POST | /api/orders | Create order |
| POST | /api/orders/:id/confirm | Confirm order (create units) |
| POST | /api/orders/:id/cancel | Cancel order |
| POST | /api/scans | Scan barcode |
| GET | /api/scans/search | Search by barcode |
| GET | /api/scans/history | Scan history |
| GET | /api/dashboard/stats | Dashboard statistics |
| POST | /api/excel/import-products | Import Excel |

## Login Bilgileri

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@uretimtakip.com | UretimAdmin2026! |
| Operator | ahmet@uretim.com | operator123 |

## Environment

```
DATABASE_URL=postgresql://postgres:uretim2026@localhost:5432/uretim_minimax
JWT_SECRET=your-secret-key
PORT=4000
```
