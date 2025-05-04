"use client";

import { useState } from "react";
import { SpendingForm } from '@/components/spending-form';
import { SpendingSummary } from '@/components/spending-summary';
import type { Expense } from "@/types/expense"; // Assuming types/expense.ts exists or will be created

export default function Home() {
  const [income, setIncome] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'date'> & { id?: string; date?: Date }) => {
    const expenseToAdd: Expense = {
      id: newExpense.id || Date.now().toString(), // Use provided id or generate one
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category, // Category might be updated by AI later
      date: newExpense.date || new Date(), // Use provided date or current date
    };
    setExpenses((prevExpenses) => [...prevExpenses, expenseToAdd]);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((exp) =>
        exp.id === updatedExpense.id ? updatedExpense : exp
      )
    );
  };

  const handleSetIncome = (newIncome: number) => {
    setIncome(newIncome);
  };


  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center text-primary">TrackWise</h1>
        <p className="text-center text-muted-foreground">Your AI-Powered Spending Tracker</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Spending Form (Income, Expenses) */}
        <div className="bg-card border rounded-lg p-6 shadow">
          <SpendingForm
             onAddExpense={handleAddExpense}
             onSetIncome={handleSetIncome}
             onUpdateExpense={handleUpdateExpense} // Pass updater function
             currentIncome={income}
          />
        </div>

        {/* Spending Summary and AI Insights */}
        <div className="bg-card border rounded-lg p-6 shadow">
          <SpendingSummary income={income} expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
