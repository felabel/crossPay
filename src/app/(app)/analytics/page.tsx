import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PredictionTool } from "@/components/analytics/prediction-tool";

export default function AnalyticsPage() {
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Predictive Analytics Tool</CardTitle>
        <CardDescription>
          Use our AI-powered tool to get predictions on future exchange rates. 
          All predictions are for informational purposes only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PredictionTool />
      </CardContent>
    </Card>
  );
}
