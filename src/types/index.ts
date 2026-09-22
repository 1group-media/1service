export type ServiceJobStatus =
  | 'intake'
  | 'diagnosing'
  | 'quoted'
  | 'approved'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';
export type PaymentMethod = 'pago_movil' | 'cash' | 'zelle';

export interface ServiceJobItem {
  id: string;
  type: 'part' | 'labor';
  description: string;
  priceUsd: number;
  quantity: number;
  partNumber?: string;
}

export interface ServiceJobOrder {
  id: string;
  workshopSlug: string;
  customerCedula: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleModel: string;
  currentMileage: number;
  reportedIssue: string;
  diagnosticNotes?: string;
  status: ServiceJobStatus;
  items: ServiceJobItem[];
  totalUsd: number;
  totalVes: number;
  bcvRate: number;
  depositRequiredUsd: number;
  depositPaidUsd: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  warrantyDays: number;
  createdAt: string;
  approvedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
}

export interface PassportRecord {
  jobId: string;
  workshopName: string;
  date: string;
  mileage: number;
  serviceSummary: string;
  partsReplaced: string[];
  totalUsd: number;
}

export interface VehicleServicePassport {
  vehiclePlate: string;
  vehicleModel: string;
  ownerCedula: string;
  currentMileage: number;
  serviceHistory: PassportRecord[];
  nextServiceMileage?: number;
  nextServiceDate?: string;
  nextServiceDescription?: string;
  lastUpdated: string;
}

export interface WorkshopProfile {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  location: string;
  phone: string;
  bcvRate: number;
  specialties: string[];
  pagoMovil: {
    bank: string;
    bankCode: string;
    phone: string;
    idDoc: string;
    holderName: string;
  };
}
