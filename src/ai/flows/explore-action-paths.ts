'use server';

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define a FinancialAction type
interface FinancialAction {
  name: string;
  description: string; // More details about the action
}

const ExploreActionPathsInputSchema = z.object({
    actions: z.array(z.object({
        name: z.string().describe("The name of the financial action"),
        description: z.string().describe("A description of the action")
    })).describe("A list of financial actions.")
});

const ExploreActionPathsOutputSchema = z.object({
    paths: z.array(z.array(z.object({
        name: z.string().describe("The name of the financial action"),
        description: z.string().describe("A description of the action")
    }))).describe("All the possible combination of paths.")
});

export type ExploreActionPathsInput = z.infer<typeof ExploreActionPathsInputSchema>;
export type ExploreActionPathsOutput = z.infer<typeof ExploreActionPathsOutputSchema>;

// Function to explore action paths using DFS
function exploreActionPaths(actions: FinancialAction[]): FinancialAction[][] {
    const paths: FinancialAction[][] = [];
    const currentPath: FinancialAction[] = [];

    function dfs(index: number) {
        if (index === actions.length) {
            paths.push([...currentPath]); // Add a copy to avoid modification
            return;
        }

        // Explore the current action
        currentPath.push(actions[index]);
        dfs(index + 1);
        currentPath.pop(); // Backtrack

        // Explore skipping the current action (optional, creates more varied paths)
        dfs(index + 1);
    }

    dfs(0); // Start DFS from the first action
    return paths;
}

const exploreActionPathsPrompt = ai.definePrompt({
    name: 'exploreActionPathsPrompt',
    input: {
        schema: ExploreActionPathsInputSchema,
    },
    output: {
        schema: ExploreActionPathsOutputSchema,
    },
    prompt: `You are an expert financial advisor. Based on the following list of possible financial actions, return all the possible paths. Each action is a node, and it has connections with the next node. If there are 3 nodes, there are 8 possible paths, including skipping some nodes. Make sure you return an array of array of actions. The actions should each have a name and a description.

List of actions:
{{#each actions}}
- Name: {{{name}}}, Description: {{{description}}}
{{/each}}
`,
});

const exploreActionPathsFlow = ai.defineFlow<
    typeof ExploreActionPathsInputSchema,
    typeof ExploreActionPathsOutputSchema
>(
    {
        name: 'exploreActionPathsFlow',
        inputSchema: ExploreActionPathsInputSchema,
        outputSchema: ExploreActionPathsOutputSchema,
    },
    async (input) => {
        const actions : FinancialAction[] = input.actions;
        const paths = exploreActionPaths(actions);
        return {
                paths: paths,
            };
    }
);

export { exploreActionPathsFlow, exploreActionPaths };