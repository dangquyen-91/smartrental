import type { BookingProperty } from './booking';

export type ContractStatus = 'draft' | 'awaiting_signatures' | 'signed' | 'cancelled';

export interface ContractParty {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export interface Contract {
  id: string;
  booking: string | { id: string };
  tenant: ContractParty | string;
  landlord: ContractParty | string;
  property: BookingProperty | string;
  terms?: string | null;
  pdfUrl?: string | null;
  electricityPrice?: number | null;
  waterPrice?: number | null;
  paymentMethod?: string | null;
  status: ContractStatus;
  signedByTenant: { signed: boolean; signedAt?: string | null };
  signedByLandlord: { signed: boolean; signedAt?: string | null };
  createdAt?: string;
}
