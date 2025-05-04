"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Icons } from "./icons";
import type { Expense } from "@/types/expense";
import { categorizeExpense } from "@/ai/flows/categorize-expense"; // Import the new AI flow

// Schema for the income form part
const incomeFormSchema = z.object({
  income: z.coerce.number().positive({ message: "Income must be a positive number." }),
});

// Schema for the expense form part
const expenseFormSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
});

interface SpendingFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'category'> & { category: string | null }) => void;
  onSetIncome: (income: number) => void;
  onUpdateExpense: (expense: Expense) => void; // Add prop for updating
  currentIncome: number | null;
}

export function SpendingForm({ onAddExpense, onSetIncome, onUpdateExpense, currentIncome }: SpendingFormProps) {
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const router = useRouter();

  // Form for income
  const incomeForm = useForm<z.infer<typeof incomeFormSchema>>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      income: currentIncome || 0,
    },
  });

  // Form for adding expenses
  const expenseForm = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
    },
  });

   // Update income form default value when currentIncome prop changes
   useEffect(() => {
    if (currentIncome !== null) {
      incomeForm.reset({ income: currentIncome });
    }
  }, [currentIncome, incomeForm]);


  async function onIncomeSubmit(values: z.infer<typeof incomeFormSchema>) {
    setIsSubmittingIncome(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async operation
      onSetIncome(values.income);
      toast({
        title: "Success!",
        description: "Income updated successfully.",
      });
      router.refresh(); // Refresh route if needed, though state handled locally
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to update income.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingIncome(false);
    }
  }

  async function onExpenseSubmit(values: z.infer<typeof expenseFormSchema>) {
    setIsSubmittingExpense(true);
    const newExpenseBase = {
      id: Date.now().toString(), // Temporary ID
      description: values.description,
      amount: values.amount,
      category: null, // Start with null category
      date: new Date(),
    };

    // Add expense optimistically with null category
    onAddExpense(newExpenseBase);
    expenseForm.reset(); // Reset form after adding

    try {
      // Call AI to categorize
      const result = await categorizeExpense({ description: values.description });
      const categorizedExpense: Expense = {
         ...newExpenseBase,
         category: result.category,
      };
       // Update the expense in the parent state with the AI category
       onUpdateExpense(categorizedExpense);

      toast({
        title: "Expense Added",
        description: `Categorized as: ${result.category || 'Uncategorized'}.`,
      });
      // router.refresh(); // Refresh may not be needed if parent state updates UI
    } catch (error) {
      console.error("Failed to categorize expense:", error);
       // Keep the expense, but show error about categorization
       onUpdateExpense({ ...newExpenseBase, category: 'Uncategorized (AI Error)' });
      toast({
        title: "Categorization Error",
        description: "Could not automatically categorize the expense.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingExpense(false);
    }
  }

  return (
    <div className="space-y-8">
       {/* Income Form */}
      <Form {...incomeForm}>
        <form onSubmit={incomeForm.handleSubmit(onIncomeSubmit)} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Manage Income</h2>
          <FormField
            control={incomeForm.control}
            name="income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter your monthly income" {...field} />
                </FormControl>
                <FormDescription>
                  Set your total monthly income.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmittingIncome}>
            {isSubmittingIncome && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Income
          </Button>
        </form>
      </Form>

       <hr className="my-8 border-border" />


      {/* Expense Form */}
      <Form {...expenseForm}>
        <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
           <FormField
            control={expenseForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Groceries, Coffee, Train ticket" {...field} />
                </FormControl>
                 <FormDescription>
                  Describe the expense. AI will categorize it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={expenseForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter amount spent" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmittingExpense}>
            {isSubmittingExpense && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Expense
          </Button>
        </form>
      </Form>
    </div>
  );
}
