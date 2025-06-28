
"use client";

import { useState, useEffect } from "react";
import { SpendingForm } from '@/components/spending-form';
import { SpendingSummary } from '@/components/spending-summary';
import { SpendingPatterns } from '@/components/spending-patterns';
import { BudgetPrediction } from '@/components/budget-prediction';
import { FinanceChatbot } from '@/components/finance-chatbot';
import type { Expense } from "@/types/expense";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ListChecks, TrendingUp, Brain, Bot, Download } from "lucide-react"; // Import icons
import { Button } from "@/components/ui/button";

export default function Home() {
  const [income, setIncome] = useState<number | null>(10000);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    // Show the install prompt
    await installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // We've used the prompt, and can't use it again, so clear it.
    setInstallPrompt(null);
  };


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
  };

  const handleSetIncome = (newIncome: number) => {
    setIncome(newIncome);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12"> {/* Removed bg-background, body has gradient now */}
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Wallet className="h-10 w-10 text-primary" data-ai-hint="logo finance" />
          <h1 className="text-4xl font-bold text-primary">TrackWise</h1>
        </div>
        <p className="text-muted-foreground">Your AI-Powered Spending Tracker</p>
        {installPrompt && (
          <Button onClick={handleInstallClick} className="mt-4">
            <Download className="mr-2 h-4 w-4" />
            Add to Home Screen
          </Button>
        )}
      </header>

      {/* Input Section */}
      <div className="bg-card border rounded-lg p-6 shadow-md mb-10">
         <SpendingForm
             onAddExpense={handleAddExpense}
             onSetIncome={handleSetIncome}
             onUpdateExpense={handleUpdateExpense}
             currentIncome={income}
         />
      </div>

      {/* Tabs for Different Views */}
       <Tabs defaultValue="summary" className="w-full">
         <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-muted/60 p-1.5 rounded-lg">
           <TabsTrigger value="summary" className="text-sm font-medium flex items-center justify-center gap-2">
             <ListChecks className="h-4 w-4" /> Summary
           </TabsTrigger>
           <TabsTrigger value="patterns" className="text-sm font-medium flex items-center justify-center gap-2">
             <TrendingUp className="h-4 w-4" /> Patterns
           </TabsTrigger>
           <TabsTrigger value="prediction" className="text-sm font-medium flex items-center justify-center gap-2">
             <Brain className="h-4 w-4" /> Prediction
           </TabsTrigger>
           <TabsTrigger value="chatbot" className="text-sm font-medium flex items-center justify-center gap-2">
             <Bot className="h-4 w-4" /> Assistant
           </TabsTrigger>
         </TabsList>

         {/* Tab Content */}
         <TabsContent value="summary">
           <div className="bg-card border rounded-lg p-6 shadow-md">
             <SpendingSummary
                income={income}
                expenses={expenses}
                onDeleteExpense={handleDeleteExpense}
             />
           </div>
         </TabsContent>
         <TabsContent value="patterns">
           <div className="bg-card border rounded-lg p-6 shadow-md">
             <SpendingPatterns expenses={expenses} />
           </div>
         </TabsContent>
          <TabsContent value="prediction">
           <div className="bg-card border rounded-lg p-6 shadow-md">
              <BudgetPrediction expenses={expenses} />
           </div>
         </TabsContent>
          <TabsContent value="chatbot">
           <div className="bg-card border rounded-lg p-6 shadow-md">
              <FinanceChatbot income={income} expenses={expenses} />
           </div>
         </TabsContent>
       </Tabs>

    </div>
  );
}
