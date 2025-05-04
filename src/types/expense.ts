export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null; // Allow null initially, AI will categorize
  date: Date;
}
