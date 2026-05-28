'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { scansApi, workstationsApi } from '@/lib/api'
import { ScanBarcode, CheckCircle, XCircle, AlertTriangle, Keyboard, Camera, X } from 'lucide-react'
import { AxiosError } from 'axios'

export default function ScanPage() {
  const [barcode, setBarcode] = useState('')
  const [selectedWorkstation, setSelectedWorkstation] = useState<string>('')
  const [lastResult, setLastResult] = useState<any>(null)
  const [scanMode, setScanMode] = useState<'keyboard' | 'manual'>('keyboard')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: workstations } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => workstationsApi.list().then(res => res.data),
  })

  const { data: rejectionReasons } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: () => scansApi.getRejectionReasons().then(res => res.data),
  })

  const scanMutation = useMutation({
    mutationFn: () => scansApi.scan(barcode, selectedWorkstation),
    onSuccess: (res) => setLastResult(res.data),
    onError: (err: AxiosError) => {
      setLastResult({
        success: false,
        result: 'error',
        message: (err.response?.data as any)?.error || 'Tarama basarisiz'
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => {
      const fullReason = rejectNotes.trim()
        ? rejectReason + ': ' + rejectNotes
        : rejectReason
      return scansApi.scanReject(barcode, selectedWorkstation, fullReason)
    },
    onSuccess: (res) => {
      setLastResult(res.data)
      setShowRejectModal(false)
      setRejectReason('')
      setRejectNotes('')
    },
    onError: (err: AxiosError) => {
      setLastResult({
        success: false,
        result: 'error',
        message: (err.response?.data as any)?.error || 'Reddetme basarisiz'
      })
    },
  })

  // Auto-focus on barcode input
  useEffect(() => {
    if (scanMode === 'keyboard' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanMode])

  const handleScan = () => {
    if (!barcode.trim() || !selectedWorkstation) {
      setLastResult({ success: false, result: 'error', message: 'Barkod ve istasyon gerekli' })
      return
    }
    scanMutation.mutate()
  }

  const handleReject = () => {
    if (!barcode.trim() || !selectedWorkstation) {
      setLastResult({ success: false, result: 'error', message: 'Barkod ve istasyon gerekli' })
      return
    }
    setShowRejectModal(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      return
    }
    rejectMutation.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  // Keyboard barcode buffer
  useEffect(() => {
    if (scanMode !== 'keyboard') return

    let buffer = ''
    let timeout: NodeJS.Timeout

    const handleBuffer = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key.length === 1) {
        buffer += e.key
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (buffer.length >= 3) {
            setBarcode(buffer)
            setScanMode('manual')
            // Auto select workstation if only one
            if (workstations?.length === 1) {
              setSelectedWorkstation(workstations[0].id)
            }
          }
          buffer = ''
        }, 100)
      }
    }

    window.addEventListener('keypress', handleBuffer)
    return () => window.removeEventListener('keypress', handleBuffer)
  }, [scanMode, workstations])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarama</h1>
          <p className="text-gray-500">Barkod okutarak uretim birimini tarayin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setScanMode('keyboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              scanMode === 'keyboard' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Klavye
          </button>
          <button
            onClick={() => setScanMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              scanMode === 'manual' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" /> Manuel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tarama Formu</h2>

          {/* Workstation Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Is Istasyonu *</label>
            <div className="grid grid-cols-3 gap-2">
              {workstations?.map((ws: any) => (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkstation(ws.id)}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    selectedWorkstation === ws.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs text-gray-500">{ws.code}</span>
                  <p className="font-medium text-gray-900">{ws.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barkod {scanMode === 'keyboard' && '(otomatik algilama aktif)'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Barkod numarasini girin..."
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-0"
              autoFocus={scanMode === 'keyboard'}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleScan}
              disabled={scanMutation.isPending}
              className="flex-1 py-4 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ScanBarcode className="w-6 h-6" />
              {scanMutation.isPending ? 'Taranyor...' : 'Kabul Et'}
            </button>
            <button
              onClick={handleReject}
              disabled={!barcode.trim() || !selectedWorkstation || rejectMutation.isPending}
              className="flex-1 py-4 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-6 h-6" />
              Reddet
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Barkod okuyucunuz varsa otomatik algilanir
          </p>
        </div>

        {/* Result */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tarama Sonucu</h2>

          {!lastResult && (
            <div className="text-center py-12 text-gray-400">
              <ScanBarcode className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Bir barkod tarayin</p>
            </div>
          )}

          {lastResult && (
            <div className={`rounded-xl p-6 ${
              lastResult.result === 'accepted' ? 'bg-green-50 border-2 border-green-200' :
              lastResult.result === 'wrong_station' ? 'bg-orange-50 border-2 border-orange-200' :
              lastResult.result === 'rejected' ? 'bg-red-100 border-2 border-red-300' :
              'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {lastResult.result === 'accepted' && <CheckCircle className="w-12 h-12 text-green-600" />}
                {lastResult.result === 'wrong_station' && <AlertTriangle className="w-12 h-12 text-orange-600" />}
                {lastResult.result === 'rejected' && <XCircle className="w-12 h-12 text-red-600" />}
                {lastResult.result === 'error' && <XCircle className="w-12 h-12 text-red-600" />}
                <div>
                  <p className={`text-lg font-bold ${
                    lastResult.result === 'accepted' ? 'text-green-700' :
                    lastResult.result === 'wrong_station' ? 'text-orange-700' :
                    lastResult.result === 'rejected' ? 'text-red-700' :
                    'text-red-700'
                  }`}>
                    {lastResult.result === 'accepted' ? 'Kabul Edildi' :
                     lastResult.result === 'wrong_station' ? 'Yanlis Istasyon' :
                     lastResult.result === 'rejected' ? 'Reddedildi' :
                     'Hata'}
                  </p>
                  <p className="text-sm">{lastResult.message}</p>
                </div>
              </div>

              {lastResult.unit && (
                <div className="bg-white/50 rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Barkod</p>
                      <p className="font-medium font-mono">{lastResult.unit.barcode}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Adim</p>
                      <p className="font-medium">{lastResult.unit.currentStep}</p>
                    </div>
                  </div>
                </div>
              )}

              {lastResult.nextWorkstation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Sonraki Istasyon:</p>
                  <p className="font-medium text-blue-900">{lastResult.nextWorkstation.name}</p>
                </div>
              )}

              <button
                onClick={() => { setLastResult(null); setBarcode(''); inputRef.current?.focus() }}
                className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
              >
                Yeni Tarama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Birim Reddet</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Barkod: <span className="font-mono font-medium">{barcode}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Red Nedeni *</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Secin...</option>
                {rejectionReasons?.map((reason: string) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Aciklama (Opsiyonel)</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Ek aciklama yazin..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border rounded-lg"
              >
                Iptal
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
