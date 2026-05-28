# Üretim Takip MiniMax - Proje Raporu

**Tarih:** 2026-05-26  
**Durum:** ✅ Tamamlandı (Faz 1 & 2)

---

## 🎯 Proje Özeti

Üretim takip sistemi — Excel'den BOM (ürün ağacı) yükleme, iş istasyonu rotaları tanımlama, üretim emirleri oluşturma ve barkod tarama ile üretim süreçlerini takip etme.

---

## 📂 Proje Yapısı

```
UretimTakipMiniMax/
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── index.ts          # Express server (port 4000)
│   │   ├── models/db.ts     # Prisma client
│   │   ├── services/
│   │   │   ├── auth.ts      # JWT authentication
│   │   │   └── excelImport.ts
│   │   ├── routes/
│   │   │   ├── auth.ts      # /api/auth/*
│   │   │   ├── products.ts  # /api/products/*
│   │   │   ├── workstations.ts
│   │   │   ├── orders.ts    # /api/orders/*
│   │   │   ├── scans.ts     # /api/scans/*
│   │   │   ├── dashboard.ts
│   │   │   └── excel.ts
│   │   └── scripts/seed.ts
│   ├── prisma/schema.prisma
│   └── .env
│
└── frontend/                  # Next.js 14 + TypeScript
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── login/page.tsx
        │   └── (app)/
        │       ├── layout.tsx    # Protected layout + sidebar
        │       ├── dashboard/page.tsx
        │       ├── products/page.tsx
        │       ├── workstations/page.tsx
        │       ├── orders/page.tsx
        │       ├── scan/page.tsx
        │       └── excel/page.tsx
        ├── components/Sidebar.tsx
        ├── lib/
        │   ├── api.ts         # Axios client
        │   └── auth.ts        # Zustand store
        ├── hooks/useScan.ts
        └── types/index.ts
```

---

## 🗄️ Veritabanı (PostgreSQL + Prisma)

### Tablolar

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcılar (admin, operator) |
| `workstations` | İş istasyonları (KESIM, MONTAJ, vs.) |
| `products` | Ürünler (BOM hiyerarşisi) |
| `product_routes` | Ürün rotaları (hangi istasyondan geçecek) |
| `production_orders` | Üretim emirleri |
| `production_units` | Üretim birimleri (barkodlu parçalar) |
| `scan_events` | Tarama kayıtları |

---

## ✨ Tamamlanan Özellikler

### Backend API

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/health` | GET | Health check |
| `/api/auth/login` | POST | Email/password giriş |
| `/api/auth/login-badge` | POST | Badge/PIN giriş |
| `/api/products` | GET | Ürün listesi (tree) |
| `/api/products/:id/routes` | POST | Rota ekleme |
| `/api/workstations` | CRUD | İstasyon yönetimi |
| `/api/workstations/seed-defaults` | POST | Varsayılan istasyonlar |
| `/api/orders` | CRUD | Emir yönetimi |
| `/api/orders/:id/confirm` | POST | Emir onayla (birimler oluştur) |
| `/api/scans` | POST | Barkod tarama |
| `/api/scans/search` | GET | Barkod ara |
| `/api/dashboard/stats` | GET | İstatistikler |
| `/api/excel/import-products` | POST | Excel import |

### Frontend Sayfaları

| Sayfa | Özellikler |
|-------|------------|
| `/login` | Email ve badge giriş seçeneği |
| `/dashboard` | İstatistik kartları, son emirler, son taramalar |
| `/products` | Hiyerarşik ağaç görünümü, CRUD, arama |
| `/workstations` | İstasyon kartları, CRUD, varsayılan ekleme |
| `/orders` | Emir listesi, filtreleme, durum takibi |
| `/scan` | Barkod tarama formu, klavye otomatik algılama |
| `/excel` | Dosya yükleme, import sonucu, şablon açıklama |

---

## 🔑 Giriş Bilgileri

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@uretimtakip.com | UretimAdmin2026! |
| Operator | ahmet@uretim.com | operator123 |

---

## ▶️ Başlatma

### Terminal 1 - Backend
```bash
cd UretimTakipMiniMax/backend
npm run dev
# http://localhost:4000
```

### Terminal 2 - Frontend
```bash
cd UretimTakipMiniMax/frontend
npm run dev
# http://localhost:3000
```

---

## 📊 Akış Diagramı

```
┌─────────────────────────────────────────────────────────────┐
│                     EXCEL IMPORT                              │
│  Sheet: Urunler (kod, ad, ust_kod, birim)                    │
│  Sheet: Rotasyon (urun_kod, istasyon_kod, sira, son_adim)     │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTS          │  PRODUCT_ROUTES                          │
│  URK-001 (root)    │  URK-001 → KESIM (1) → MONTAJ (2)       │
│  └─ URK-001-01      │  URK-001-01 → BOYAMA (1)               │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION ORDER                                            │
│  Emir No: EMR-001, Urun: URK-001, Adet: 100                  │
│  Durum: draft → in_progress → completed                      │
└──────────────────────────────┬────────────────────────────────┘
                               │
                      ┌────────┴────────┐
                      │   EMR-001-0001  │
                      │   EMR-001-0002  │
                      │      ...        │
                      │   EMR-001-0100   │  ← Barkod atanır
                      └────────┬────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  SCAN @ WORKSTATION                                          │
│  Barkod okut → Doğru istasyon kontrolü → step +1             │
│  Tüm birimler tamamlanınca emir "completed"                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Sonraki Adımlar (Önerilen)

1. **Gerçek Zamanlı Bildirimler** — WebSocket ile tarama sonucu anında göster
2. **Operatör Ataması** — İş istasyonuna kim çalışıyor
3. **Kalite Kontrol** — Hatalı ürünlerin red nedenleri
4. **Rapor Export** — PDF/Excel çıktıları
5. **Mobile Responsive** — Mobil tarama ekranı

---

## 📝 Notlar

- Frontend Next.js 14.2.0 (experimental appDir) kullanıyor
- Backend port: 4000, Frontend port: 3000
- Auth: JWT (7 gün geçerli)
- Veritabanı: PostgreSQL (uretim_minimax)
