"use client";

import { useState } from "react";
import { SpendingForm } from '@/components/spending-form';
import { SpendingSummary } from '@/components/spending-summary';
import { SpendingPatterns } from '@/components/spending-patterns'; // New component
import { BudgetPrediction } from '@/components/budget-prediction'; // New component
import { FinanceChatbot } from '@/components/finance-chatbot'; // New component
import type { Expense } from "@/types/expense";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

export default function Home() {
  const [income, setIncome] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleAddExpense = (newExpense: Omit<Expense, 'id' | 'date'> & { id?: string; date?: Date }) => {
    const expenseToAdd: Expense = {
      id: newExpense.id || Date.now().toString(),
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      date: newExpense.date || new Date(),
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

   const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prevExpenses) =>
      prevExpenses.filter((exp) => exp.id !== expenseId)
    );
    // Optionally add a toast notification for deletion
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

      {/* Input Section */}
      <div className="bg-card border rounded-lg p-6 shadow mb-8">
         <SpendingForm
             onAddExpense={handleAddExpense}
             onSetIncome={handleSetIncome}
             onUpdateExpense={handleUpdateExpense}
             currentIncome={income}
         />
      </div>

      {/* Tabs for Different Views */}
       <Tabs defaultValue="summary" className="w-full">
         <TabsList className="grid w-full grid-cols-4 mb-4"> {/* Adjust grid-cols based on number of tabs */}
           <TabsTrigger value="summary">Summary</TabsTrigger>
           <TabsTrigger value="patterns">Patterns</TabsTrigger>
           <TabsTrigger value="prediction">Prediction</TabsTrigger>
           <TabsTrigger value="chatbot">Assistant</TabsTrigger>
         </TabsList>

         {/* Tab Content */}
         <TabsContent value="summary">
           <div className="bg-card border rounded-lg p-6 shadow">
             <SpendingSummary
                income={income}
                expenses={expenses}
                onDeleteExpense={handleDeleteExpense} // Pass delete handler
             />
           </div>
         </TabsContent>
         <TabsContent value="patterns">
           <div className="bg-card border rounded-lg p-6 shadow">
             <SpendingPatterns expenses={expenses} />
           </div>
         </TabsContent>
          <TabsContent value="prediction">
           <div className="bg-card border rounded-lg p-6 shadow">
              <BudgetPrediction expenses={expenses} />
           </div>
         </TabsContent>
          <TabsContent value="chatbot">
           <div className="bg-card border rounded-lg p-6 shadow">
              <FinanceChatbot income={income} expenses={expenses} />
           </div>
         </TabsContent>
       </Tabs>

    </div>
  );
}
