"use server";

import { predictExchangeRate } from "@/ai/flows/exchange-rate-predictions";
import { z } from "zod";
import type { PredictExchangeRateOutput } from "@/ai/flows/exchange-rate-predictions";

const PredictActionSchema = z.object({
  baseCurrency: z.string(),
  quoteCurrency: z.string(),
  currentRate: z.coerce.number(),
});

type PredictActionState = {
  data: PredictExchangeRateOutput | null;
  error: string | null;
  message?: string;
};

export async function getExchangeRatePrediction(
  prevState: PredictActionState,
  formData: FormData
): Promise<PredictActionState> {
  const validatedFields = PredictActionSchema.safeParse({
    baseCurrency: formData.get("baseCurrency"),
    quoteCurrency: formData.get("quoteCurrency"),
    currentRate: formData.get("currentRate"),
  });

  if (!validatedFields.success) {
    return {
      data: null,
      error: "Invalid input provided.",
    };
  }
  
  const { baseCurrency, quoteCurrency, currentRate } = validatedFields.data;

  try {
    const historicalRates = [
        { date: "2023-01-01", rate: currentRate * 0.95 },
        { date: "2023-04-01", rate: currentRate * 0.98 },
        { date: "2023-07-01", rate: currentRate * 1.02 },
        { date: "2023-10-01", rate: currentRate * 1.01 },
    ];

    const result = await predictExchangeRate({
      baseCurrency,
      quoteCurrency,
      currentRate,
      historicalRates,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { data: null, error: `Prediction failed: ${errorMessage}` };
  }
}
