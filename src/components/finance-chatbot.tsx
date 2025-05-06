"use client";

import { useState, useRef, useEffect } from 'react';
import { financeChatbot, FinanceChatbotInput, FinanceChatbotOutput } from '@/ai/flows/finance-chatbot';
import type { Expense } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

interface FinanceChatbotProps {
  expenses: Expense[];
  income: number | null;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function FinanceChatbot({ expenses, income }: FinanceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
     setTimeout(() => { // Timeout ensures it runs after DOM updates
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
         if (scrollViewport) {
             scrollViewport.scrollTop = scrollViewport.scrollHeight;
         }
     }, 0);
  };


  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); // Prevent form submission if used in a form
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    // Add user message to chat
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    scrollToBottom();


    const inputData: FinanceChatbotInput = {
        userQuery: userMessage,
        income: income,
        // Convert Date objects to ISO strings for the flow
        expenses: expenses.map(exp => ({
            ...exp,
            date: exp.date instanceof Date ? exp.date.toISOString() : exp.date
        })),
        // history: messages // Optionally include history if flow supports it
    };

    try {
      const result: FinanceChatbotOutput = await financeChatbot(inputData);
      const botMessage: Message = { role: 'bot', content: result.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Failed to get chatbot response:", err);
      const errorMessage: Message = { role: 'bot', content: "Sorry, I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

   // Scroll to bottom when messages change
   useEffect(() => {
    scrollToBottom();
  }, [messages]);


  return (
    <Card className="h-[550px] flex flex-col shadow-sm border"> {/* Increased height, added border/shadow */}
      <CardHeader className="border-b pb-4"> {/* Added border */}
        <CardTitle className="text-xl font-semibold text-primary">AI Finance Assistant</CardTitle> {/* Adjusted styling */}
        <CardDescription>Ask questions about your spending.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col pt-6"> {/* Added top padding */}
         <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" ref={scrollAreaRef}> {/* Adjusted padding/margin for scrollbar */}
           <div className="space-y-4 pr-4"> {/* Added padding to prevent content clipping */}
             {messages.map((message, index) => (
               <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                 {message.role === 'bot' && (
                   <Avatar className="h-8 w-8 border border-muted"> {/* Added border */}
                     {/* Add a placeholder or actual image for the bot */}
                     <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">AI</AvatarFallback> {/* Styled fallback */}
                   </Avatar>
                 )}
                 <div className={`rounded-lg p-3 max-w-[80%] text-sm shadow-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}> {/* Added shadow */}
                   {message.content}
                 </div>
                  {message.role === 'user' && (
                   <Avatar className="h-8 w-8 border border-muted"> {/* Added border */}
                     {/* Add a placeholder or actual image for the user */}
                     <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">U</AvatarFallback> {/* Styled fallback */}
                   </Avatar>
                 )}
               </div>
             ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border border-muted">
                     <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">AI</AvatarFallback>
                   </Avatar>
                    <div className="rounded-lg p-3 bg-muted max-w-[75%] text-sm flex items-center space-x-2 shadow-sm"> {/* Added shadow */}
                       <Icons.spinner className="h-4 w-4 animate-spin" />
                       <span>Thinking...</span>
                    </div>
                 </div>
              )}
           </div>
         </ScrollArea>
         <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto border-t pt-4"> {/* Input fixed at bottom */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask something..."
            disabled={isLoading}
            className="flex-grow rounded-full px-4" /* Rounded input */
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} className="rounded-full"> {/* Rounded button */}
            {isLoading ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.arrowRight className="h-4 w-4"/>}
          </Button>
         </form>
      </CardContent>
    </Card>
  );
}
