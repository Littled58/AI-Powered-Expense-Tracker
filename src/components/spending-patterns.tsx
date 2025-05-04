"use client";

import { useState, useEffect } from 'react';
import { analyzeSpendingPatterns, AnalyzeSpendingPatternsInput, AnalyzeSpendingPatternsOutput } from '@/ai/flows/analyze-spending-patterns';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "./icons";
import { Skeleton } from './ui/skeleton'; // Import Skeleton

interface SpendingPatternsProps {
  expenses: Expense[];
}

export function SpendingPatterns({ expenses }: SpendingPatternsProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch patterns only if there are enough expenses
    if (expenses.length >= 5) { // Threshold for meaningful analysis
      const fetchPatterns = async () => {
        setIsLoading(true);
        setError(null);
        setPatterns([]);

        const inputData: AnalyzeSpendingPatternsInput = {
          // Convert Date objects to ISO strings for the flow
          expenses: expenses.map(exp => ({
              ...exp,
              date: exp.date instanceof Date ? exp.date.toISOString() : exp.date // Handle potential string dates
          })),
        };

        try {
          const result = await analyzeSpendingPatterns(inputData);
          setPatterns(result.patterns);
        } catch (err) {
          console.error("Failed to fetch spending patterns:", err);
          setError("Could not analyze spending patterns. Please try again later.");
          setPatterns([]);
        } finally {
          setIsLoading(false);
        }
      };

      // Debounce or delay fetching patterns
       const timer = setTimeout(fetchPatterns, 700); // Longer delay might be suitable
       return () => clearTimeout(timer);

    } else {
      // Clear patterns if not enough data
      setPatterns([]);
      setIsLoading(false);
      setError(null);
    }
  }, [expenses]); // Re-run when expenses change

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Patterns Analysis</CardTitle>
        <CardDescription>AI-detected trends in your spending habits.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <Icons.alertTriangle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : patterns.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5 text-sm">
            {patterns.map((pattern, index) => (
              <li key={index}>{pattern}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {expenses.length < 5
              ? 'Add more expenses (at least 5) for pattern analysis.'
              : 'No specific spending patterns detected yet.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
