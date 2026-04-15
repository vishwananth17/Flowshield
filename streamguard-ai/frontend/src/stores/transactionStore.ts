import { create } from 'zustand';

interface Transaction {
  id: string;
  external_id: string;
  amount: string;
  currency: string;
  merchant_name: string;
  risk_score: number;
  risk_label: string;
  decision: string;
  created_at: string;
}

interface TransactionStore {
  recentTransactions: Transaction[];
  addTransactionFromSocket: (tx: Transaction) => void;
  setInitialTransactions: (txs: Transaction[]) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  recentTransactions: [],
  
  addTransactionFromSocket: (tx) => {
    set(state => ({
      recentTransactions: [tx, ...state.recentTransactions].slice(0, 200)
    }));
  },

  setInitialTransactions: (txs) => {
    set({ recentTransactions: txs });
  }
}));

