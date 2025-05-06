"use client";

import { useState, useEffect } from 'react';
import { predictBudget, PredictBudgetInput, PredictBudgetOutput } from '@/ai/flows/predict-budget';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "./icons";
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/utils'; // Assuming you have this helper
import { Badge } from '@/components/ui/badge'; // Import Badge

interface BudgetPredictionProps {
  expenses: Expense[];
  // Add income prop if needed by the flow
  // income: number | null;
}

export function BudgetPrediction({ expenses }: BudgetPredictionProps) {
  const [prediction, setPrediction] = useState<PredictBudgetOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionPeriod, setPredictionPeriod] = useState("next month"); // Example state for period

  useEffect(() => {
    // Fetch prediction only if there are enough expenses
    if (expenses.length >= 10) { // Threshold for potentially useful prediction
      const fetchPrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);

        const inputData: PredictBudgetInput = {
           // Convert Date objects to ISO strings for the flow
           expenses: expenses.map(exp => ({
               ...exp,
               date: exp.date instanceof Date ? exp.date.toISOString() : exp.date
           })),
          predictionPeriod: predictionPeriod,
          // Pass income here if required by your flow:
          // income: income,
        };

        try {
          const result = await predictBudget(inputData);
          setPrediction(result);
        } catch (err) {
          console.error("Failed to fetch budget prediction:", err);
          setError("Could not generate budget prediction. Please try again later.");
          setPrediction(null);
        } finally {
          setIsLoading(false);
        }
      };

       // Debounce or delay fetching
       const timer = setTimeout(fetchPrediction, 1000);
       return () => clearTimeout(timer);

    } else {
      // Clear prediction if not enough data
      setPrediction(null);
      setIsLoading(false);
      setError(null);
    }
  }, [expenses, predictionPeriod]); // Re-run when expenses or period change

  return (
    <Card className="shadow-sm border"> {/* Added border/shadow */}
      <CardHeader>
        <div className="flex justify-between items-center">
             <div>
                <CardTitle className="text-xl font-semibold text-primary">Budget Prediction</CardTitle> {/* Adjusted styling */}
                <CardDescription>AI forecast for your spending ({predictionPeriod}).</CardDescription>
                 {/* TODO: Add dropdown/selector to change predictionPeriod */}
             </div>
             {isLoading && <Icons.spinner className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 py-4"> {/* Added padding */}
             <div className='flex items-center space-x-2'>
                 <Skeleton className="h-6 w-24" />
                 <Skeleton className="h-4 w-32" />
             </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <Icons.alertTriangle className="h-4 w-4" />
            <AlertTitle>Prediction Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : prediction ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg"> {/* Added background */}
              <p className="text-sm font-medium text-muted-foreground">Predicted Total Spending:</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(prediction.predictedTotalSpending)}</p> {/* Increased size */}
              {prediction.confidenceNote && (
                <Badge variant="secondary" className="mt-2 text-xs">{prediction.confidenceNote}</Badge>
              )}
            </div>

            {prediction.categoryPredictions && prediction.categoryPredictions.length > 0 && (
              <div>
                <p className="font-semibold mb-2 text-muted-foreground">Predicted Spending by Category:</p>
                <ul className="space-y-1 text-sm">
                  {prediction.categoryPredictions
                     .sort((a, b) => b.predictedAmount - a.predictedAmount) // Sort descending
                     .map((catPred) => (
                    <li key={catPred.category} className="flex justify-between items-center py-1 border-b last:border-none">
                      <span className="font-medium">{catPred.category}</span>
                       <span className="font-semibold">{formatCurrency(catPred.predictedAmount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {prediction.predictedTotalSpending === 0 && !prediction.confidenceNote?.includes("Insufficient data") && (
                <p className="text-sm text-muted-foreground text-center pt-4">
                    Prediction might be zero due to limited or inconsistent historical data.
                </p>
             )}
          </div>
        ) : (
          <div className="text-center py-6"> {/* Centered placeholder */}
             <Icons.piggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-2"/>
             <p className="text-sm text-muted-foreground">
                 {expenses.length < 10
                 ? 'Add more expenses (at least 10) for budget prediction.'
                 : 'Prediction data is not available or cannot be generated.'}
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
