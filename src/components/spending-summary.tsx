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
import { getSpendingInsights, SpendingInsightsInput } from "@/ai/flows/spending-insights"; // Import updated Input type
import type { Expense } from "@/types/expense";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "./icons";
import { Button } from "@/components/ui/button"; // Import Button
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { format } from 'date-fns'; // Import date-fns
import { formatCurrency } from "@/lib/utils"; // Import formatCurrency

interface SpendingSummaryProps {
  income: number | null;
  expenses: Expense[];
   onDeleteExpense: (expenseId: string) => void; // Add prop for deleting expenses
}

// Helper to format date
const formatDate = (date: Date | string | undefined) => {
    if (!date) return '--';
    try {
        // Ensure date is a Date object before formatting
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) { // Check if date is valid
             console.warn("Invalid date encountered:", date);
             return '--';
        }
        return format(dateObj, 'MMM dd, yyyy');
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return '--'; // Fallback for invalid dates
    }
}

export function SpendingSummary({ income, expenses, onDeleteExpense }: SpendingSummaryProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);

  // Calculate summary data (aggregated by category) based on props
  const summaryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach((expense) => {
       const category = expense.category || "Uncategorized"; // Ensure 'Uncategorized' for null categories
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
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

        // Use the summaryData (aggregated expenses) for insights
        const insightInput: SpendingInsightsInput = {
          income: income,
          expenses: summaryData.map(item => ({
            category: item.name,
            amount: item.amount,
          })),
          // budgetGoals are no longer sent
        };

        try {
          const result = await getSpendingInsights(insightInput);
          if (result && result.insights) {
             setInsights(result.insights);
          } else {
             setErrorInsights("Received no insights from the AI.");
             setInsights([]);
          }
        } catch (error) {
          console.error("Failed to fetch spending insights:", error);
           const errorMsg = error instanceof Error ? error.message : "An unknown error occurred.";
          setErrorInsights(`Failed to generate insights: ${errorMsg}. Please try again later.`);
          setInsights([]);
        } finally {
          setIsLoadingInsights(false);
        }
      };

      // Debounce fetching insights
      const timer = setTimeout(fetchInsights, 800); // Slightly longer delay
      return () => clearTimeout(timer);

    } else {
       // Clear insights if conditions aren't met
       setInsights([]);
       setIsLoadingInsights(false);
       setErrorInsights(null);
    }
  }, [income, expenses, summaryData]); // Rerun when income or expenses change


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Spending Overview</h2>

       {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
             <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
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
             <Icons.creditCard className="h-4 w-4 text-muted-foreground" />
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
             <Icons.piggyBank className="h-4 w-4 text-muted-foreground" />
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

      {/* Expense List */}
       <Card>
         <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
             <CardDescription>Your recorded expense entries.</CardDescription>
         </CardHeader>
         <CardContent>
           <ScrollArea className="h-[250px] w-full pr-4"> {/* Adjust height as needed */}
             {expenses.length > 0 ? (
               <ul className="space-y-3">
                 {expenses
                    .slice() // Create a shallow copy before sorting to avoid mutating the original prop
                    .sort((a, b) => {
                        const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
                        const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
                        // Handle potential invalid dates during sort
                        if (isNaN(dateA)) return 1;
                        if (isNaN(dateB)) return -1;
                        return dateB - dateA; // Sort by date descending
                    })
                    .map((expense) => (
                   <li key={expense.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                     <div>
                       <p className="font-medium">{expense.description}</p>
                       <p className="text-sm text-muted-foreground">
                         {expense.category || "Uncategorized"} - {formatDate(expense.date)}
                       </p>
                     </div>
                     <div className="flex items-center space-x-2">
                        <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => onDeleteExpense(expense.id)}
                            aria-label={`Delete expense: ${expense.description}`}
                        >
                            <Icons.trash className="h-4 w-4" />
                        </Button>
                     </div>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded yet.</p>
             )}
           </ScrollArea>
         </CardContent>
       </Card>

      {/* Spending Chart */}
       {summaryData.length > 0 ? ( // Use summaryData to check if chart should render
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
                 layout="vertical" // Change layout to vertical for better label readability
               >
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis type="number" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100} // Adjust width as needed
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                 <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'hsl(var(--muted))' }} // Add cursor highlight
                  />
                 <Legend />
                 <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount Spent" radius={[0, 4, 4, 0]} /> {/* Add radius */}
               </BarChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
      ) : (
        null // No chart if no data
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
          ) : insights.length > 0 && insights[0] !== "Provide income and add some expenses to get personalized insights." ? ( // Check for valid insights
             <ul className="space-y-2 list-disc pl-5 text-sm">
               {insights.map((insight, index) => (
                 <li key={index}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {income === null || expenses.length === 0
                ? 'Add income and expenses to get AI insights.'
                : 'No insights generated yet or not enough data for meaningful tips.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
