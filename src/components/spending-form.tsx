"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Icons } from "./icons";

const formSchema = z.object({
  income: z.string().min(1, {
    message: "Income must be at least 1 characters.",
  }),
  food: z.string().optional(),
  transportation: z.string().optional(),
  entertainment: z.string().optional(),
});

export function SpendingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: "",
      food: "",
      transportation: "",
      entertainment: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate data saving (replace with your actual logic)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    toast({
      title: "Success!",
      description: "Spending data saved successfully.",
    });
    // After data is saved, refresh the route
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Income</FormLabel>
              <FormControl>
                <Input placeholder="Enter your monthly income" {...field} />
              </FormControl>
              <FormDescription>
                Enter your total monthly income to track your expenses against it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="food"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food</FormLabel>
              <FormControl>
                <Input placeholder="Enter amount spent on food" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transportation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transportation</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter amount spent on transportation"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="entertainment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entertainment</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter amount spent on entertainment"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Spending Data
        </Button>
      </form>
    </Form>
  );
}
