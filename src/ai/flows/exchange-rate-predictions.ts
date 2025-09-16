// src/ai/flows/exchange-rate-predictions.ts
'use server';

/**
 * @fileOverview Predicts future exchange rates based on current data and trends.
 *
 * - predictExchangeRate - Predicts future exchange rates.
 * - PredictExchangeRateInput - Input type for the predictExchangeRate function.
 * - PredictExchangeRateOutput - Output type for the predictExchangeRate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictExchangeRateInputSchema = z.object({
  baseCurrency: z.string().describe('The base currency for the exchange rate.'),
  quoteCurrency: z.string().describe('The quote currency for the exchange rate.'),
  currentRate: z.number().describe('The current exchange rate between the two currencies.'),
  historicalRates: z
    .array(z.object({date: z.string(), rate: z.number()}))
    .describe('An array of historical exchange rates.'),
});
export type PredictExchangeRateInput = z.infer<typeof PredictExchangeRateInputSchema>;

const PredictExchangeRateOutputSchema = z.object({
  shouldPresentPrediction: z
    .boolean()
    .describe(
      'Whether the prediction should be presented to the user based on model confidence.'
    ),
  predictedRate: z.number().optional().describe('The predicted future exchange rate.'),
  reasoning: z
    .string()
    .optional()
    .describe('The AI model’s reasoning for the prediction or lack thereof.'),
});
export type PredictExchangeRateOutput = z.infer<typeof PredictExchangeRateOutputSchema>;

export async function predictExchangeRate(input: PredictExchangeRateInput): Promise<PredictExchangeRateOutput> {
  return predictExchangeRateFlow(input);
}

const predictExchangeRatePrompt = ai.definePrompt({
  name: 'predictExchangeRatePrompt',
  input: {schema: PredictExchangeRateInputSchema},
  output: {schema: PredictExchangeRateOutputSchema},
  prompt: `You are an AI model that predicts future exchange rates between two currencies.

You will receive the base currency, the quote currency, the current exchange rate, and an array of historical exchange rates.

Based on this information, you will predict the future exchange rate and provide your reasoning.

You will also determine whether the prediction should be presented to the user based on your confidence in the prediction.

If you are not confident in the prediction, you should set shouldPresentPrediction to false and not provide a predictedRate or reasoning.

Base Currency: {{{baseCurrency}}}
Quote Currency: {{{quoteCurrency}}}
Current Exchange Rate: {{{currentRate}}}
Historical Rates: {{#each historicalRates}}{{{date}}}: {{{rate}}}\n{{/each}}`,
});

const predictExchangeRateFlow = ai.defineFlow(
  {
    name: 'predictExchangeRateFlow',
    inputSchema: PredictExchangeRateInputSchema,
    outputSchema: PredictExchangeRateOutputSchema,
  },
  async input => {
    const {output} = await predictExchangeRatePrompt(input);
    return output!;
  }
);
