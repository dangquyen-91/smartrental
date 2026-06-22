export type Role = 'tenant' | 'landlord' | 'admin' | 'provider';

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string | null;
  isPhoneVerified?: boolean;
  bankAccount?: BankAccount | null;
}

// Cấu trúc nằm trong res.data.data khi login/register
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
}
