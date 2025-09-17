'use server';
/**
 * @fileOverview A flow for generating simulated live exchange rates.
 * 
 * - getLiveRates: Generates and returns a set of fluctuating exchange rates.
 * - GetLiveRatesInput: The input type for the getLiveRates function.
 * - GetLiveRatesOutput: The return type for the getLiveRates function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetLiveRatesInputSchema = z.object({
  currencies: z.array(z.string()).describe("A list of currency codes to generate rates for."),
});
export type GetLiveRatesInput = z.infer<typeof GetLiveRatesInputSchema>;

// Dynamically create the output schema based on currency pairs
const generateOutputSchema = (currencies: string[]) => {
  const schemaFields: { [key: string]: z.ZodNumber } = {};
  for (let i = 0; i < currencies.length; i++) {
    for (let j = 0; j < currencies.length; j++) {
      if (i !== j) {
        const pair = `${currencies[i]}-${currencies[j]}`;
        schemaFields[pair] = z.number().describe(`The exchange rate from ${currencies[i]} to ${currencies[j]}.`);
      }
    }
  }
  return z.object(schemaFields);
};

// We can't generate the schema dynamically for the prompt definition itself,
// so we'll use a generic object and validate later. For the prompt, we will describe the structure.
const DynamicRateObject = z.record(z.string(), z.number());
export type GetLiveRatesOutput = z.infer<typeof DynamicRateObject>;

const prompt = ai.definePrompt({
    name: 'liveRatePrompt',
    input: { schema: GetLiveRatesInputSchema },
    output: { schema: DynamicRateObject },
    prompt: `
You are a financial data simulator. Your task is to generate a JSON object containing realistic but randomly fluctuating exchange rates for the given currency pairs.

Base the rates loosely on the following, but introduce minor fluctuations (e.g., +/- 0.1% to 2%) to simulate a live market.

- 1 USD = 0.93 EUR
- 1 USD = 0.79 GBP
- 1 USD = 157 JPY
- 1 USD = 0.000015 BTC
- 1 EUR = 1.08 USD
- 1 EUR = 0.85 GBP
- 1 EUR = 169 JPY
- 1 EUR = 0.000016 BTC
- 1 GBP = 1.27 USD
- 1 GBP = 1.18 EUR
- 1 GBP = 199 JPY
- 1 GBP = 0.000019 BTC
- 1 JPY = 0.0064 USD
- 1 JPY = 0.0059 EUR
- 1 JPY = 0.005 GBP
- 1 JPY = 0.00000023 BTC
- 1 BTC = 66000 USD
- 1 BTC = 62000 EUR
- 1 BTC = 52000 GBP
- 1 BTC = 4300000 JPY

Create rate pairs for all combinations of the following currencies: {{{json currencies}}}.
For example, for [USD, EUR, JPY], you should generate rates for USD-EUR, USD-JPY, EUR-USD, EUR-JPY, JPY-USD, and JPY-EUR.
Do not include pairs where the from and to currency are the same (e.g., USD-USD).
The output must be a single, valid JSON object where keys are the currency pair strings (e.g., "USD-EUR") and values are the numeric rates.
`,
});


const getLiveRatesFlow = ai.defineFlow(
  {
    name: 'getLiveRatesFlow',
    inputSchema: GetLiveRatesInputSchema,
    outputSchema: DynamicRateObject,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate exchange rates.");
    }
    
    // Validate the dynamic output
    const dynamicSchema = generateOutputSchema(input.currencies);
    const validationResult = dynamicSchema.safeParse(output);
    
    if (!validationResult.success) {
        console.error("Generated rates failed validation:", validationResult.error);
        throw new Error("AI-generated rates had an invalid format.");
    }

    return validationResult.data;
  }
);


export async function getLiveRates(input: GetLiveRatesInput): Promise<GetLiveRatesOutput> {
    return getLiveRatesFlow(input);
}
