# Üretim Takip MiniMax - Kullanıcı İhtiyaçları Analiz Raporu

**Tarih:** 2026-05-27  
**Proje:** UretimTakipMiniMax  
**Analiz Yapan:** General Agent  
**Durum:** Analiz Tamamlandı, Coder'a Görev Gönderildi

---

## Yönetici Özeti

Üretim Takip MiniMax projesi temel barkod tarama ve üretim takip akışını başarıyla implemente etmiş durumda. Ancak operasyonel mükemmellik için kritik kullanıcı ihtiyaçları tespit edilmiştir. Bu rapor, son kullanıcı perspektifinden eksik özellikleri öncelik sırasıyla dokumentedir.

---

## Mevcut Durum

### Tamamlanmış Özellikler

| Alan | Durum |
|------|-------|
| Auth (Email + Badge) | ✅ |
| Dashboard İstatistikleri | ✅ |
| Ürün Yönetimi (BOM Tree) | ✅ |
| İş İstasyonu Yönetimi | ✅ |
| Üretim Emirleri (CRUD) | ✅ |
| Barkod Tarama | ✅ |
| Excel Import | ✅ |

### Potansiyel Sorunlar

1. **Emir Detay Sayfası Yok** - "Detay" butonu tıklanabilir ama boş kalıyor
2. **Birim Sorgulama Eksik** - Barkod ile birim aranamıyor
3. **Kalite Kontrol UI'sı Yok** - Red nedeni field'ı var ama kullanılmıyor
4. **Görsel Raporlama Yok** - Sayısal veri var ama grafik yok
5. **Kullanıcı CRUD Eksik** - Sadece seed ile oluşturulan kullanıcılar var

---

## Tespit Edilen Eksik Kullanıcı İhtiyaçları

### 1. Emir Detay Sayfası - 🔴 KRİTİK

**Mevcut Durum:**  
Orders sayfasında "Detay" butonu var (`src/app/(app)/orders/page.tsx:139`) ama sadece `setSelectedOrder(order)` çağırıyor, modal açılmıyor.

**Kullanıcı İhtiyacı:**
> "Bir emrin tüm birimlerini görmek istiyorum. Hangisi hangi adımda, kim taradı, ne zaman tamamlandı?"

**Gereken:**
- Emir detay sayfası (`/orders/:id`)
- Birim listesi tablosu (barcode, step, status, tarih)
- İlerleme çubuğu
- Emir istatistikleri

**Etki:** Operasyonel karar verme için kritik

---

### 2. Birim/Barkod Arama - 🔴 KRİTİK

**Mevcut Durum:**  
Backend endpoint mevcut (`/api/scans/search`) ama UI'da yok.

**Kullanıcı İhtiyacı:**
> "Elimdeki barkodun hangi emre ait olduğunu, hangi adımda olduğunu hızlıca sorgulamak istiyorum."

**Gereken:**
-独立 arama sayfası
- Barkod input
- Sonuç: birim bilgisi + tarama geçmişi + rota

**Etki:** Problem çözme süresini kısaltır

---

### 3. Kalite Kontrol - 🟠 YÜKSEK

**Mevcut Durum:**  
Prisma schema'da `rejectionReason` field'ı var (`production_unit.rejectionReason`) ama UI'da kullanılmıyor.

**Kullanıcı İhtiyacı:**
> "Hatalı ürünleri reddetmek ve nedenini kaydetmek istiyorum. Sonra raporlayabilmeliyim."

**Gereken:**
- Tarama sırasında "Reddet" seçeneği
- Red nedeni listesi (malzeme hatası, ölçüm hatası, vs.)
- Reddedilen birimlerin listesi

**Etki:** Kalite iyileştirme için gerekli

---

### 4. Performans İstatistikleri - 🟠 YÜKSEK

**Mevcut Durum:**  
Dashboard sadece sayısal kartlar gösteriyor.

**Kullanıcı İhtiyacı:**
> "Günlük tarama trendini grafik olarak görmek istiyorum. Hangi istasyonun daha verimli olduğunu karşılaştırmak istiyorum."

**Gereken:**
- 7 günlük tarama grafiği
- İstasyon bazlı kapasite karşılaştırması

**Etki:** Operasyonel optimizasyon

---

### 5. Kullanıcı Yönetimi - 🟡 ORTA

**Mevcut Durum:**  
Sadece seed script ile kullanıcı oluşturuluyor. CRUD yok.

**Kullanıcı İhtiyacı:**
> "Yeni operatör eklemek, şifre değiştirmek, rol atamak istiyorum."

**Gereken:**
- Kullanıcı listesi sayfası
- Oluşturma/düzenleme formları
- Admin-only erişim kontrolü

**Etki:** Sistem yönetimi için gerekli

---

### 6. Rapor Export - 🟡 ORTA

**Mevcut Durum:**  
Sadece import var, export yok.

**Kullanıcı İhtiyacı:**
> "Emirraporunu PDF olarak almak istiyorum. Haftalık istatistikleri Excel'e aktarmak istiyorum."

**Gereken:**
- PDF export endpoint'i
- Excel export (tarama raporu)

**Etki:** Yönetim raporlaması

---

### 7. Bildirim Sistemi - 🟡 ORTA

**Mevcut Durum:**  
Tarama sonucu sadece aynı sayfada görünüyor.

**Kullanıcı İhtiyacı:**
> "Yeni tarama olduğunda operasyonel yönetici anında haberdar olsun istiyorum."

**Gereken:**
- WebSocket ile anlık bildirim
- Toast notification
- Sesli uyarı

**Etki:** Gerçek zamanlı operasyon

---

### 8. Operatör Ataması - 🟢 DÜŞÜK

**Mevcut Durum:**  
`scan_events.scannedById` kaydediliyor ama istasyona kim atandığı bilinmiyor.

**Kullanıcı İhtiyacı:**
> "İstasyona kimlerin çalıştığını görmek ve takip etmek istiyorum."

**Etki:** İş gücü yönetimi

---

### 9. Tarih Format Düzeltmeleri - 🟢 DÜŞÜK

**Mevcut Durum:**  
Tarihler Türkçe formatta değil.

**Kullanıcı İhtiyacı:**
> "Tarihlerin 25.05.2026 14:30 formatında görünmesini istiyorum."

---

### 10. Rota Yönetimi - 🟢 DÜŞÜK

**Mevcut Durum:**  
Ürüne rota ekleme sadece detay panelinde görünüyor.

**Kullanıcı İhtiyacı:**
> "Ürüne rota eklemek/düzenlemek için daha kolay bir arayüz istiyorum."

---

## Öncelik Matrisi

```
        Etki Yüksek          Etki Düşük
   ┌─────────────────────┬─────────────────────┐
P  │  1. Emir Detay       │  8. Operatör Ataması │
o  │  2. Birim Arama      │  9. Tarih Format    │
t  ├─────────────────────┼─────────────────────┤
a  │  3. Kalite Kontrol   │ 10. Rota Yönetimi   │
n  │  4. Performans İst. │                     │
s  ├─────────────────────┼─────────────────────┤
i  │  5. Kullanıcı Yön.  │                     │
y  │  6. Rapor Export    │                     │
i  │  7. Bildirimler     │                     │
   └─────────────────────┴─────────────────────┘
```

---

## Teknisyen Notları

### Gereken Paketler

```bash
# Backend
npm install socket.io

# Frontend
npm install socket.io-client
npm install recharts
npm install react-hot-toast
```

### Prisma Değişiklikleri

```prisma
// Yeni tablo: Operatör-İstasyon ataması
model UserWorkstation {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  workstationId String
  workstation   Workstation @relation(fields: [workstationId], references: [id])
  assignedAt    DateTime @default(now())

  @@unique([userId, workstationId])
}
```

### Endpoint Önerileri

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/orders/:id` | GET | Emir + birimler + istatistikler |
| `/api/units/search` | GET | Barkod ile birim ara |
| `/api/scans/reject` | POST | Birimi reddet |
| `/api/users` | CRUD | Kullanıcı yönetimi |
| `/api/dashboard/trend` | GET | 7 günlük trend |

---

## Sonraki Adımlar

1. ✅ **Analiz Tamamlandı** - Bu rapor
2. ✅ **Coder'a Görev Gönderildi** - Öncelik 1-5 için
3. ⏳ **Coder Çalışıyor** - Emir detay, arama, kalite kontrol, performans, kullanıcı yönetimi
4. ⏳ **Test ve Doğrulama** - Verifier agent
5. ⏳ **Sonraki Özellikler** - Rapor export, bildirimler, operatör ataması

---

## Sonuç

Proje güçlü bir temel üzerine kurulmuş. Ancak son kullanıcı deneyimi içinkritik eksiklikler tespit edilmiştir. Emir detay sayfası ve birim arama en yüksek öncelikli ihtiyaçlardır. Coder agent'a görev gönderilmiş ve geliştirme sürecindedir.

---

**Rapor Tarihi:** 2026-05-27 01:30  
**Analiz Eden:** General Agent  
**Görev Durumu:** Coder'a gönderildi
