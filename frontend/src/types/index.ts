// Types for production tracking system

export interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'supervisor' | 'operator'
  badgeId?: string
}

export interface Workstation {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
}

export interface Product {
  id: string
  code: string
  name: string
  unit?: string
  description?: string
  level: number
  parentId?: string
  parent?: Product
  children?: Product[]
  routes?: ProductRoute[]
}

export interface ProductRoute {
  id: string
  productId: string
  workstationId: string
  workstation?: Workstation
  stepOrder: number
  isFinalStep: boolean
  expectedDuration?: number
  notes?: string
}

export interface ProductionOrder {
  id: string
  orderNo: string
  productId: string
  product?: Product
  quantity: number
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: string
  notes?: string
  createdById: string
  createdBy?: User
  createdAt?: string
  completedAt?: string
  units?: ProductionUnit[]
  unitStats?: Record<string, number>
}

export interface ProductionUnit {
  id: string
  orderId: string
  barcode: string
  currentStep: number
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  currentWorkstationId?: string
  completedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  scanEvents?: ScanEvent[]
}

export interface ScanEvent {
  id: string
  unitId: string
  unit?: ProductionUnit
  workstationId: string
  workstation?: Workstation
  scannedById?: string
  scannedBy?: User
  result: 'accepted' | 'wrong_station' | 'duplicate' | 'rejected'
  isRootScan: boolean
  notes?: string
  deviceId?: string
  createdAt: string
}

export interface ScanResponse {
  success: boolean
  result: string
  message: string
  unit: {
    id: string
    barcode: string
    currentStep: number
    status: string
  }
  nextStep?: number
  nextWorkstation?: {
    id: string
    code: string
    name: string
  }
}

export interface DashboardStats {
  orders: {
    draft: number
    in_progress: number
    completed: number
    cancelled: number
    total: number
  }
  todayScans: number
  activeUnits: number
  completedToday: number
  workstationStats: Array<{
    id: string
    code: string
    name: string
    scanCount: number
  }>
  dailyScans?: Array<{
    date: string
    count: number
  }>
}
