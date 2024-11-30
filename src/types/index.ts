export interface Transaction {
  tags: never[];
  id: string;
  userId?: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  description: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
  metadata?: {
    location?: string;
    tags?: string[];
  }
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  settings: {
    defaultCurrency: string;
    language: string;
  }
} 