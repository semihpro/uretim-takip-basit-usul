'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ScanBarcode,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FileSpreadsheet,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth'

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Urunler' },
  { href: '/orders', icon: ClipboardList, label: 'Uretim Emirleri' },
  { href: '/search', icon: ScanBarcode, label: 'Birim Sorgula' },
  { href: '/scan', icon: ScanBarcode, label: 'Tarama' },
  { href: '/workstations', icon: Settings, label: 'Istasyonlar' },
  { href: '/excel', icon: FileSpreadsheet, label: 'Excel Import' },
  { href: '/users', icon: Users, label: 'Kullanicilar', adminOnly: true },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin'
    }
    return true
  })

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-indigo-600">Uretim Takip</h1>
        </div>

        {/* Normal Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleMenuItems.filter(item => !item.adminOnly).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg
                  transition-colors
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Admin Navigation */}
        {visibleMenuItems.some(item => item.adminOnly) && (
          <>
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-400 uppercase">Yonetim</p>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              {visibleMenuItems.filter(item => item.adminOnly).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-colors
                      ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                )
              })}
            </nav>
          </>
        )}

        {/* User menu */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{user?.fullName?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@uretimtakip.com'}</p>
            </div>
          </div>
          <button
            className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            onClick={() => {
              localStorage.clear()
              window.location.href = '/login'
            }}
          >
            <LogOut className="w-5 h-5" />
            <span>Cikis Yap</span>
          </button>
        </div>
      </aside>
    </>
  )
}
