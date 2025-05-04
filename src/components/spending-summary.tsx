"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getSpendingInsights } from "@/ai/flows/spending-insights";
import type { Expense } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "./icons";

interface SpendingSummaryProps {
  income: number | null;
  expenses: Expense[];
}

// Helper to format currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "$--.--";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function SpendingSummary({ income, expenses }: SpendingSummaryProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);

  // Calculate summary data based on props
  const summaryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach((expense) => {
       const category = expense.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const savings = useMemo(() => {
    return income !== null ? income - totalExpenses : null;
  }, [income, totalExpenses]);

  useEffect(() => {
    // Fetch insights only if there's income and some expenses
    if (income !== null && expenses.length > 0) {
      const fetchInsights = async () => {
        setIsLoadingInsights(true);
        setErrorInsights(null);
        setInsights([]); // Clear previous insights

        const spendingData = {
          income: income, // Use actual income
          expenses: expenses.map((item) => ({ // Use actual expenses
            category: item.category || "Uncategorized",
            amount: item.amount,
          })),
          // TODO: Allow users to set budget goals, for now use a placeholder or omit
           budgetGoals: summaryData.map(item => ({ // Example goals based on current spending
             category: item.name,
             amount: item.amount * 0.9 // Target 90% of current spending
           })),
        };
        try {
          const result = await getSpendingInsights(spendingData);
          setInsights(result.insights);
        } catch (error) {
          console.error("Failed to fetch spending insights:", error);
          setErrorInsights("Failed to generate insights. Please try again later.");
          setInsights([]);
        } finally {
          setIsLoadingInsights(false);
        }
      };

      fetchInsights();
    } else {
       setInsights([]); // Clear insights if no data
       setIsLoadingInsights(false);
       setErrorInsights(null);
    }
  }, [income, expenses, summaryData]); // Re-run when income or expenses change

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Spending Overview</h2>

       {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
             <Icons.dollarSign className="h-4 w-4 text-muted-foreground" /> {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(income)}</div>
             <p className="text-xs text-muted-foreground">
              {income === null ? 'Set your income' : 'Current monthly income'}
             </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
             <Icons.creditCard className="h-4 w-4 text-muted-foreground" /> {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
             <p className="text-xs text-muted-foreground">
               Across {summaryData.length} categories
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
             <Icons.piggyBank className="h-4 w-4 text-muted-foreground" /> {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${savings !== null && savings < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(savings)}
              </div>
             <p className="text-xs text-muted-foreground">
               {income === null ? 'Set income to see savings' : `Remaining after expenses`}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Spending Chart */}
       {expenses.length > 0 ? (
         <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Visual breakdown of your spending.</CardDescription>
            </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={300}>
               <BarChart
                 data={summaryData}
                 margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
               >
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} />
                 <YAxis fontSize={12} />
                 <Tooltip formatter={(value: number) => formatCurrency(value)} />
                 <Legend />
                 <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount Spent" />
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
      ) : (
         <Alert>
            <Icons.info className="h-4 w-4" />
           <AlertTitle>No Expenses Yet</AlertTitle>
           <AlertDescription>
             Add some expenses using the form to see your spending summary here.
           </AlertDescription>
         </Alert>
      )}

      {/* AI Insights Section */}
      <Card>
         <CardHeader>
            <CardTitle>AI Financial Insights</CardTitle>
             <CardDescription>Personalized tips based on your data.</CardDescription>
         </CardHeader>
        <CardContent>
          {isLoadingInsights ? (
             <div className="flex items-center justify-center p-4">
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
               <span>Generating insights...</span>
             </div>
          ) : errorInsights ? (
             <Alert variant="destructive">
               <Icons.alertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{errorInsights}</AlertDescription>
             </Alert>
          ) : insights.length > 0 ? (
             <ul className="space-y-2 list-disc pl-5 text-sm">
               {insights.map((insight, index) => (
                 <li key={index}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {income === null || expenses.length === 0
                ? 'Add income and expenses to get AI insights.'
                : 'No insights available currently.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
