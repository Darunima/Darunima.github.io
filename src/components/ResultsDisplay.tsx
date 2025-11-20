import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingDown } from 'lucide-react';
import { AllocationResult, PresenceFlags, HybridDetailedResult } from '@/utils/transportationOptimizer';
import { HybridStepsDisplay } from './HybridStepsDisplay';
import { DetailedStepsView } from './DetailedStepsView';

interface ResultsDisplayProps {
  results: {
    classical: AllocationResult;
    mmrGA: AllocationResult;
    hybrid: HybridDetailedResult;
  };
  flags: PresenceFlags;
  lpOptCost?: number;
}

export function ResultsDisplay({ results, flags, lpOptCost }: ResultsDisplayProps) {
  const formatCost = (cost: number) => cost.toFixed(2);

  const PipelineCard = ({ 
    title, 
    result, 
    color 
  }: { 
    title: string; 
    result: AllocationResult; 
    color: string;
  }) => {
    const isOptimal = result.certificate?.optimality;
    const costDiff = lpOptCost ? result.cost - lpOptCost : 0;
    const isNearOptimal = lpOptCost ? Math.abs(costDiff) < 1e-6 : true;

    return (
      <Card className={`p-6 border-2 ${color} transition-all hover:shadow-lg`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{title}</h3>
            {isNearOptimal ? (
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="w-3 h-3 mr-1" />
                Optimal
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning text-warning">
                <AlertCircle className="w-3 h-3 mr-1" />
                Suboptimal
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="text-2xl font-bold">{formatCost(result.cost)}</span>
            </div>

            <div className="flex justify-between items-center p-2 bg-card rounded">
              <span className="text-sm text-muted-foreground">Iterations</span>
              <span className="font-semibold">{result.iterations}</span>
            </div>

            {result.certificate && (
              <div className="flex justify-between items-center p-2 bg-card rounded">
                <span className="text-sm text-muted-foreground">MODI Certificate</span>
                <span className={`font-semibold ${result.certificate.optimality ? 'text-success' : 'text-warning'}`}>
                  {result.certificate.optimality ? 'Verified ✓' : 'Not Verified'}
                </span>
              </div>
            )}

            {lpOptCost && (
              <div className="flex justify-between items-center p-2 bg-card rounded">
                <span className="text-sm text-muted-foreground">vs LP Optimal</span>
                <span className={`font-semibold flex items-center gap-1 ${isNearOptimal ? 'text-success' : 'text-destructive'}`}>
                  {costDiff > 0 && '+'}
                  {formatCost(costDiff)}
                  {isNearOptimal && <TrendingDown className="w-3 h-3" />}
                </span>
              </div>
            )}
          </div>

          {/* Allocation Matrix Preview */}
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">Allocation Matrix (preview)</div>
            <div className="bg-muted/50 p-2 rounded overflow-x-auto">
              <div className="font-mono text-xs whitespace-pre">
                {result.allocation.slice(0, 3).map((row, i) => (
                  <div key={i}>
                    [{row.slice(0, 3).map(v => v.toFixed(0).padStart(4)).join(' ')}
                    {row.length > 3 ? ' ...' : ''}]
                  </div>
                ))}
                {result.allocation.length > 3 && <div>...</div>}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Presence Flags Info */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold mb-1">Matrix Condition</h4>
            <p className="text-sm text-muted-foreground">
              Flags: {flags.flagString} — 
              {flags.A && ' Negatives'}{flags.B && ' Zeros'}{flags.C && ' Positives'}
            </p>
          </div>
          {lpOptCost && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">LP Optimal Cost</div>
              <div className="text-2xl font-bold text-primary">{formatCost(lpOptCost)}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Pipeline Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PipelineCard
          title="Classical Manual"
          result={results.classical}
          color="border-primary"
        />
        <PipelineCard
          title="MMR + GA"
          result={results.mmrGA}
          color="border-secondary"
        />
        <PipelineCard
          title="Hybrid (Best)"
          result={results.hybrid}
          color="border-accent"
        />
      </div>

      {/* Best Solution Highlight */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Best Solution: Hybrid Algorithm</h3>
            <p className="text-muted-foreground">
              Combined MMR + MODI + GA optimization
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">{formatCost(results.hybrid.cost)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Cost</div>
          </div>
        </div>
      </Card>

      {/* Hybrid Algorithm Step-by-Step Breakdown */}
      {results.hybrid.steps && (
        <HybridStepsDisplay 
          steps={results.hybrid.steps} 
          bestApproach={results.hybrid.bestApproach}
          finalAllocation={results.hybrid.allocation}
          finalCost={results.hybrid.cost}
          lpOptimalCost={lpOptCost}
        />
      )}

      {/* Detailed Mathematical Steps for Classical Method */}
      {results.classical.detailedSteps && (
        <DetailedStepsView execution={results.classical.detailedSteps} />
      )}

      {/* Detailed Mathematical Steps for MMR+GA Method */}
      {results.mmrGA.detailedSteps && (
        <DetailedStepsView execution={results.mmrGA.detailedSteps} />
      )}
    </div>
  );
}
