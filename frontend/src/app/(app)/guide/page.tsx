'use client'

import { useState } from 'react'
import { 
  Package, Users, Settings, BarChart3, Upload, ScanBarcode, 
  HelpCircle, ChevronRight, ChevronDown, Play, CheckCircle,
  FileSpreadsheet, ClipboardList, Factory, ArrowRight
} from 'lucide-react'

export default function GuidePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sections = [
    {
      id: 'dashboard',
      icon: BarChart3,
      title: 'Dashboard (Gösterge Paneli)',
      description: 'Tüm üretim verilerinizin özetini görün',
      steps: [
        'Dashboard sayfası açıldığında otomatik olarak güncellenir',
        'Sol menüden "Dashboard" seçin',
        'Kartlarda: Aktif emirler, bugünkü taramalar, tamamlanan işler',
        'Grafiklerde: Son 7 günün tarama trendini görün',
        'İstasyon bazlı tarama sayılarını inceleyin'
      ]
    },
    {
      id: 'products',
      icon: Package,
      title: 'Ürünler (BOM Yapısı)',
      description: 'Ürün ağacını oluşturun ve yönetin',
      steps: [
        'Sol menüden "Ürünler" seçin',
        'Üst menüde "Yeni Ürün" butonuna tıklayın',
        'Kod ve ad girin (örn: URK-001, Ana Ürün)',
        'Alt ürün eklemek için üst_kod olarak ana ürünün kodunu girin',
        'Ağaç görünümünde alt ürünleri görmek için ok işaretine tıklayın'
      ]
    },
    {
      id: 'workstations',
      icon: Factory,
      title: 'İş İstasyonları',
      description: 'Üretim hattı istasyonlarını tanımlayın',
      steps: [
        'Sol menüden "İş İstasyonları" seçin',
        '"Varsayılanları Ekle" ile standart istasyonları ekleyin',
        'VEYA "Yeni İstasyon" ile manuel ekleme yapın',
        'Kod ve açıklama girin (örn: KESIM, MONTAJ, BOYAMA)',
        'İstasyonlar ürün rotalarında kullanılacak'
      ]
    },
    {
      id: 'excel',
      icon: FileSpreadsheet,
      title: 'Excel Import',
      description: 'Toplu ürün ve rota yüklemesi yapın',
      steps: [
        'Sol menüden "Excel Import" seçin',
        '"Şablon İndir" ile örnek Excel dosyasını indirin',
        'Excel\'de iki sheet var: Urunler ve Rotasyon',
        'Ürünleri tanımlayın: kod, ad, ust_kod, birim',
        'Rotasyonu tanımlayın: urun_kod, istasyon_kod, sira, son_adim',
        'Dosyayı seçin ve "Import Et" butonuna tıklayın'
      ]
    },
    {
      id: 'orders',
      icon: ClipboardList,
      title: 'Üretim Emirleri',
      description: 'Üretim emri oluşturun ve takip edin',
      steps: [
        'Sol menüden "Emirler" seçin',
        '"Yeni Emir" butonuna tıklayın',
        'Emir no, ürün seçin ve adet belirleyin',
        'Emir oluşturulduktan sonra ▶ butonuyla onaylayın',
        'Onay sonrası otomatik olarak birimler (barkodlar) oluşturulur',
        'Detay sayfasından birimlerin durumunu takip edin'
      ]
    },
    {
      id: 'scan',
      icon: ScanBarcode,
      title: 'Tarama',
      description: 'Barkod okutarak üretimi takip edin',
      steps: [
        'Sol menüden "Tarama" seçin',
        'İş istasyonunu seçin (butonlarla)',
        'Barkod okutucu varsa otomatik algılar, yoksa manuel girin',
        '"Tara" butonuna tıklayın',
        'Doğru istasyon = yeşil ✓ (adım ilerler)',
        'Yanlış istasyon = turuncu uyarı',
        'Reddet butonu ile kalite kontrolü yapın'
      ]
    },
    {
      id: 'search',
      icon: ScanBarcode,
      title: 'Birim Sorgulama',
      description: 'Barkod ile birim arayın',
      steps: [
        'Sol menüden "Birim Sorgula" seçin',
        'Barkod numarasını girin',
        'Birimin hangi emre ait olduğunu ve hangi adımda olduğunu görün',
        'Tarama geçmişini inceleyin'
      ]
    },
    {
      id: 'users',
      icon: Users,
      title: 'Kullanıcı Yönetimi',
      description: 'Sistem kullanıcılarını yönetin (Admin)',
      steps: [
        'Sol menüden "Kullanıcılar" seçin (sadece Admin için)',
        '"Yeni Kullanıcı" ile ekleme yapın',
        'Email, şifre, rol (admin/operator/supervisor) seçin',
        'Badge ID operatörler için kart numarasıdır'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Factory className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Üretim Takip Kullanım Rehberi</h1>
              <p className="text-indigo-100 mt-2">Sistemin nasıl kullanılacağını adım adım öğrenin</p>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {sections.map((section) => (
              <a 
                key={section.id}
                href={`#${section.id}`}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm text-center transition-colors"
              >
                <section.icon className="w-5 h-5 mx-auto mb-1" />
                {section.title.split(' ')[0]}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Getting Started */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-green-600" />
            Başlangıç
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">1. Giriş Yap</h3>
              <p className="text-green-700 text-sm">
                Admin: <code>admin@uretimtakip.com</code><br/>
                Şifre: <code>UretimAdmin2026!</code>
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">2. Kurulum Yap</h3>
              <p className="text-blue-700 text-sm">
                Önce istasyonları ekle, sonra Excel ile ürünleri yükle
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">3. Emir Oluştur</h3>
              <p className="text-purple-700 text-sm">
                Üretim emri ver, onayla, birimler otomatik oluşsun
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">4. Taramaya Başla</h3>
              <p className="text-orange-700 text-sm">
                Barkod okut, istasyonda adımı tamamla
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div 
              key={section.id}
              id={section.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-gray-500 text-sm">{section.description}</p>
                  </div>
                </div>
                {expandedSection === section.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSection === section.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <ol className="mt-4 space-y-3">
                    {section.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-600 pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            İpuçları
          </h3>
          <ul className="space-y-2 text-yellow-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>Excel import yaparken önce <code>Urunler</code> sheetini, sonra <code>Rotasyon</code> sheetini doldurun</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>Barkod okuyucu otomatik algılanır - klavye gibi davranır</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>Emri onaylamadan önce mutlaka ürünün rotası tanımlı olmalı</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>Tüm birimler tamamlandığında emir otomatik <code>Tamamlandı</code> durumuna geçer</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Teknik destek için: sistem yöneticiniz ile iletişime geçin</p>
        </div>
      </div>
    </div>
  )
}