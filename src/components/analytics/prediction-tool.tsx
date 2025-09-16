"use client";

import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { getExchangeRatePrediction } from "@/app/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { currencies } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} variant="accent">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Predicting...
        </>
      ) : (
        "Predict Rate"
      )}
    </Button>
  );
}

export function PredictionTool() {
  const initialState = { data: null, error: null };
  const [state, formAction] = useFormState(
    getExchangeRatePrediction,
    initialState
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <FormLabel>Base Currency</FormLabel>
                <Select name="baseCurrency">
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                    {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <FormLabel>Quote Currency</FormLabel>
                <Select name="quoteCurrency">
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                    {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <FormLabel>Current Rate</FormLabel>
                <Input name="currentRate" type="number" step="any" placeholder="e.g., 1.08" />
            </div>
        </div>

        <SubmitButton />
      </form>

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.data && (
        <Card className="mt-6 bg-secondary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              AI Prediction Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.data.shouldPresentPrediction ? (
              <>
                <div className="text-center">
                  <p className="text-muted-foreground">Predicted Future Rate</p>
                  <p className="text-4xl font-bold text-primary">{state.data.predictedRate?.toFixed(4)}</p>
                </div>
                <Alert>
                  <AlertTitle>AI Reasoning</AlertTitle>
                  <AlertDescription className="font-code text-sm">
                    {state.data.reasoning}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert>
                 <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Prediction Withheld</AlertTitle>
                <AlertDescription>
                  The AI model determined that a prediction could not be made with high confidence.
                  <p className="font-code text-sm mt-2 p-2 bg-muted rounded">Reasoning: {state.data.reasoning}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
