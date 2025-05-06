
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
      income: currentIncome ?? 10000, // Set default to 10000 if currentIncome is null/undefined
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
    // If currentIncome becomes null, the form retains the last value,
    // or the initial default (10000) if it was null initially.
  }, [currentIncome, incomeForm]);


  async function onIncomeSubmit(values: z.infer<typeof incomeFormSchema>) {
    setIsSubmittingIncome(true);
    try {
      // Simulate async operation if needed, otherwise remove
      // await new Promise((resolve) => setTimeout(resolve, 100));
      onSetIncome(values.income);
      toast({
        title: "Success!",
        description: "Income updated successfully.",
      });
      // router.refresh(); // Usually not needed if parent state updates UI
    } catch (error) {
       console.error("Failed to update income:", error);
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
      id: Date.now().toString(), // Temporary ID, ideally use UUID later
      description: values.description,
      amount: values.amount,
      category: null, // Start with null category
      date: new Date(),
    };

    // Add expense optimistically with null category first
    onAddExpense(newExpenseBase);
    expenseForm.reset(); // Reset form immediately

    try {
      // Call AI to categorize
      const result = await categorizeExpense({ description: values.description });
      const categorizedExpense: Expense = {
         ...newExpenseBase,
         category: result?.category || "Other", // Fallback to 'Other' if AI returns null/empty or undefined category
      };
       // Update the expense in the parent state with the AI category
       onUpdateExpense(categorizedExpense);

      toast({
        title: "Expense Added",
        description: `Auto-categorized as: ${categorizedExpense.category}.`,
      });

    } catch (error) {
      console.error("Failed to categorize expense via AI:", error); // Log the actual error
       // Update expense with a default category if AI fails
       onUpdateExpense({ ...newExpenseBase, category: 'Uncategorized' });
      toast({
        title: "Categorization Issue",
        description: "Could not auto-categorize. Set to 'Uncategorized'.",
        variant: "destructive", // Use default or warning variant? default might be less alarming
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
                  Describe the expense. AI will attempt to categorize it.
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

