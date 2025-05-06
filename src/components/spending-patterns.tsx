"use client";

import { useState, useEffect } from 'react';
import { analyzeSpendingPatterns, AnalyzeSpendingPatternsInput, AnalyzeSpendingPatternsOutput } from '@/ai/flows/analyze-spending-patterns';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "./icons";
import { Skeleton } from './ui/skeleton'; // Import Skeleton
import { Badge } from '@/components/ui/badge'; // Import Badge

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
    <Card className="shadow-sm border"> {/* Added border/shadow */}
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Spending Patterns Analysis</CardTitle> {/* Adjusted styling */}
        <CardDescription>AI-detected trends in your spending habits.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-4"> {/* Added padding */}
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
          <ul className="space-y-3 text-sm"> {/* Increased spacing */}
            {patterns.map((pattern, index) => (
              <li key={index} className="flex items-start gap-2">
                 <Icons.info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" /> {/* Added icon */}
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6"> {/* Centered placeholder */}
            <Icons.search className="h-10 w-10 text-muted-foreground mx-auto mb-2"/>
            <p className="text-sm text-muted-foreground">
              {expenses.length < 5
                ? 'Add more expenses (at least 5) for pattern analysis.'
                : 'No specific spending patterns detected yet.'}
            </p>
         </div>
        )}
      </CardContent>
    </Card>
  );
}
