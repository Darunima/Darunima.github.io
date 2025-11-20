import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingDown, Zap, FileSpreadsheet, FileText } from "lucide-react";
import type { HybridStep } from "@/utils/transportationOptimizer";
import { exportToExcel, exportToPDF } from "@/utils/exportResults";
import { toast } from "sonner";

interface HybridStepsDisplayProps {
  steps: HybridStep[];
  bestApproach: string;
  finalAllocation: number[][];
  finalCost: number;
  lpOptimalCost?: number;
}

export const HybridStepsDisplay = ({ 
  steps, 
  bestApproach, 
  finalAllocation, 
  finalCost,
  lpOptimalCost 
}: HybridStepsDisplayProps) => {
  const handleExportExcel = () => {
    try {
      exportToExcel({
        steps,
        bestApproach,
        finalAllocation,
        finalCost,
        lpOptimalCost
      });
      toast.success("Results exported to Excel successfully!");
    } catch (error) {
      toast.error("Failed to export to Excel");
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF({
        steps,
        bestApproach,
        finalAllocation,
        finalCost,
        lpOptimalCost
      });
      toast.success("Results exported to PDF successfully!");
    } catch (error) {
      toast.error("Failed to export to PDF");
      console.error(error);
    }
  };

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Hybrid Algorithm - Step by Step Execution</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
        <CardDescription>
          The hybrid algorithm tries 5 different optimization approaches and selects the best one
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => {
          const isBest = step.name === bestApproach;
          
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isBest
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">
                      {step.name}
                    </h4>
                    {isBest && (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Best Solution
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-background/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Initial Cost</div>
                      <div className="font-mono font-semibold text-foreground">
                        {step.initialCost.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-background/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Final Cost</div>
                      <div className="font-mono font-semibold text-primary">
                        {step.finalCost.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-background/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Iterations</div>
                      <div className="font-mono font-semibold text-foreground">
                        {step.iterations}
                      </div>
                    </div>
                    
                    <div className="bg-background/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Improvement
                      </div>
                      <div className={`font-mono font-semibold ${
                        step.improvement > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                      }`}>
                        {step.improvement > 0 ? "-" : ""}{Math.abs(step.improvement).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Final Selection</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            After comparing all 5 approaches, <span className="font-semibold text-primary">{bestApproach}</span> produced 
            the lowest cost solution and was selected as the final result.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
