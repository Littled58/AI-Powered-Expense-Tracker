"use client";

import { useEffect, useState } from "react";
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

const data = [
  {
    name: "Food",
    amount: 4000,
  },
  {
    name: "Transportation",
    amount: 3000,
  },
  {
    name: "Entertainment",
    amount: 2000,
  },
  {
    name: "Other",
    amount: 1000,
  },
];

export function SpendingSummary() {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      const spendingData = {
        income: 5000,
        expenses: data.map((item) => ({
          category: item.name,
          amount: item.amount,
        })),
        budgetGoals: data.map((item) => ({
          category: item.name,
          amount: item.amount * 0.8, // Example: Set budget goal to 80% of current spending
        })),
      };
      try {
        const result = await getSpendingInsights(spendingData);
        setInsights(result.insights);
      } catch (error) {
        console.error("Failed to fetch spending insights:", error);
        setInsights(["Failed to generate insights. Please try again later."]);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Spending Summary</h2>
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">AI Insights</h3>
        <ul>
          {insights.map((insight, index) => (
            <li key={index} className="mb-2">
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
