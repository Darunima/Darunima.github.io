import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calculator, CheckCircle2, ArrowRight } from "lucide-react";
import type { DetailedAlgorithmExecution } from "@/types/detailedSteps";

interface DetailedStepsViewProps {
  execution: DetailedAlgorithmExecution;
}

export const DetailedStepsView = ({ execution }: DetailedStepsViewProps) => {
  const formatMatrix = (matrix: number[][]) => {
    return matrix.map((row, i) => (
      <div key={i} className="font-mono text-xs">
        [{row.map(v => v.toFixed(1).padStart(6)).join(' ')}]
      </div>
    ));
  };

  return (
    <Card className="mt-6 border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Detailed Mathematical Solution: {execution.algorithmName}</CardTitle>
        </div>
        <CardDescription>
          Step-by-step mathematical breakdown showing every calculation and decision
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Initial State */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
              1
            </span>
            Initial Problem Setup
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Cost Matrix:</div>
              <div className="bg-background p-3 rounded border">
                {formatMatrix(execution.initialState.costMatrix)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Supply:</div>
                <div className="bg-background p-2 rounded border font-mono text-sm">
                  [{execution.initialState.supply.join(', ')}]
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total: {execution.initialState.totalSupply}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Demand:</div>
                <div className="bg-background p-2 rounded border font-mono text-sm">
                  [{execution.initialState.demand.join(', ')}]
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total: {execution.initialState.totalDemand}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Phases */}
        {execution.phases.map((phase, phaseIndex) => (
          <div key={phaseIndex} className="p-4 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                {phaseIndex + 2}
              </span>
              {phase.phaseName}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{phase.phaseDescription}</p>
            
            <Accordion type="single" collapsible className="w-full">
              {phase.steps.map((step, stepIndex) => (
                <AccordionItem key={stepIndex} value={`step-${stepIndex}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <Badge variant="outline" className="text-xs">
                        Step {step.step}
                      </Badge>
                      <span className="font-medium">{step.operation}</span>
                      {step.result !== undefined && (
                        <>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary font-mono text-sm">
                            {typeof step.result === 'number' ? step.result.toFixed(2) : step.result}
                          </span>
                        </>
                      )}
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="pl-4 pt-3 space-y-3 border-l-2 border-primary/20 ml-2">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Explanation:
                        </div>
                        <div className="text-sm">
                          {step.description}
                        </div>
                      </div>
                      
                      {step.formula && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Formula:
                          </div>
                          <div className="bg-muted/50 p-3 rounded border font-mono text-sm whitespace-pre-wrap">
                            {step.formula}
                          </div>
                        </div>
                      )}
                      
                      {step.result !== undefined && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Result:
                          </div>
                          <div className="bg-primary/10 p-3 rounded border border-primary/20 font-mono text-sm font-semibold text-primary">
                            {typeof step.result === 'number' ? step.result.toFixed(2) : step.result}
                          </div>
                        </div>
                      )}
                      
                      {step.matrixState && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Allocation Matrix State:
                          </div>
                          <div className="bg-background p-3 rounded border">
                            {formatMatrix(step.matrixState)}
                          </div>
                        </div>
                      )}
                      
                      {step.highlightCells && step.highlightCells.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          📍 Highlighted cell: ({step.highlightCells[0].row + 1}, {step.highlightCells[0].col + 1})
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        {/* Final State */}
        <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Final Solution
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Final Allocation Matrix:</div>
              <div className="bg-background p-3 rounded border">
                {formatMatrix(execution.finalState.allocation)}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-background rounded border">
              <span className="text-lg font-semibold">Total Transportation Cost:</span>
              <span className="text-3xl font-bold text-primary">
                {execution.finalState.totalCost.toFixed(2)}
              </span>
            </div>
            
            {execution.finalState.isOptimal && (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Optimal Solution Verified
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
