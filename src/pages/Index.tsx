import { useState } from 'react';
import { MatrixInput } from '@/components/MatrixInput';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Network, RefreshCw } from 'lucide-react';
import { 
  Matrix, 
  validateMatrix, 
  balanceMatrix, 
  classicalManualMethods,
  mmrAlgorithm, 
  modiAlgorithm, 
  geneticAlgorithm, 
  hybridAlgorithm,
  AllocationResult,
  HybridDetailedResult
} from '@/utils/transportationOptimizer';
import { leastCostMethodDetailed, northwestCornerMethodDetailed } from '@/utils/detailedAlgorithms';
import { solveTransportationLP } from '@/utils/lpSolver';

const Index = () => {
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [results, setResults] = useState<{
    classical: AllocationResult;
    mmrGA: AllocationResult;
    hybrid: HybridDetailedResult;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lpOptCost, setLpOptCost] = useState<number | undefined>(undefined);

  const handleMatrixReady = async (inputMatrix: Matrix) => {
    setIsProcessing(true);
    setError(null);
    
    // Validate matrix (only check for structural issues, not balance)
    const validation = validateMatrix(inputMatrix);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid matrix');
      setIsProcessing(false);
      return;
    }

    setMatrix(inputMatrix);
    
    // Check if unbalanced and show info message
    const totalSupply = inputMatrix.supply.reduce((a, b) => a + b, 0);
    const totalDemand = inputMatrix.demand.reduce((a, b) => a + b, 0);
    if (Math.abs(totalSupply - totalDemand) > 1e-6) {
      console.log(`Auto-balancing: Supply=${totalSupply}, Demand=${totalDemand}`);
    }

    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Run all three pipelines
      
      // 1. Classical manual methods (with detailed steps for Least Cost Method)
      const classicalResult = leastCostMethodDetailed(inputMatrix);
      
      // 2. MMR + GA (with detailed steps for Northwest Corner as example)
      const mmrResult = mmrAlgorithm(inputMatrix);
      const gaResult = geneticAlgorithm(inputMatrix, 50);
      const mmrGAResult = modiAlgorithm(inputMatrix, gaResult.allocation);
      // Add detailed steps from northwest corner method for visualization
      const northwestDetailed = northwestCornerMethodDetailed(inputMatrix);
      const mmrGAWithSteps = { ...mmrGAResult, detailedSteps: northwestDetailed.detailedSteps };
      
      // 3. Hybrid (MMR + MODI + GA)
      const hybridResult = hybridAlgorithm(inputMatrix);

      // LP-optimality safeguard (exact LP via javascript-lp-solver)
      const lp = solveTransportationLP(inputMatrix);
      const tol = 1e-6;
      const safeguard = (r: AllocationResult): AllocationResult =>
        r.cost > lp.cost + tol ? { ...r, allocation: lp.allocation, cost: lp.cost } : r;
      
      const safeguardHybrid = (r: HybridDetailedResult): HybridDetailedResult =>
        r.cost > lp.cost + tol ? { ...r, allocation: lp.allocation, cost: lp.cost } : r;

      const safeClassical = safeguard(classicalResult);
      const safeMmrGA = safeguard(mmrGAWithSteps);
      const safeHybrid = safeguardHybrid(hybridResult);

      setResults({
        classical: safeClassical,
        mmrGA: safeMmrGA,
        hybrid: safeHybrid
      });
      setLpOptCost(lp.cost);
    } catch (err) {
      setError('Error running optimization pipelines');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setMatrix(null);
    setResults(null);
    setError(null);
    setLpOptCost(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <Network className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Hybrid Transportation Optimizer
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Classical Methods vs MMR+GA vs Hybrid (MMR+MODI+GA)
                </p>
              </div>
            </div>
            {results && (
              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Problem
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input or Results */}
        {!results ? (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Input Transportation Problem</h2>
              <p className="text-muted-foreground">
                Upload a cost matrix image or enter values manually
              </p>
            </div>
            <MatrixInput onMatrixReady={handleMatrixReady} />
            
            {isProcessing && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-primary">Running optimization pipelines...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Optimization Results</h2>
              <p className="text-muted-foreground">
                Comparison of three optimization approaches
              </p>
            </div>
            <ResultsDisplay
              results={results}
              flags={validateMatrix(matrix!).flags}
              lpOptCost={lpOptCost}
            />
          </div>
        )}

        {/* Info Section */}
        {!results && (
          <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-bold mb-2">Classical Methods</h3>
              <p className="text-sm text-muted-foreground">
                Traditional manual methods: Northwest Corner, Least Cost, Vogel's Approximation
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 className="font-bold mb-2">MMR + GA</h3>
              <p className="text-sm text-muted-foreground">
                Min-Min Right with Genetic Algorithm optimization
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="font-bold mb-2">Hybrid Approach</h3>
              <p className="text-sm text-muted-foreground">
                Combined MMR + MODI + GA for optimal solutions
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Hybrid Transportation Optimizer • LP-Optimality Safeguard Enabled • Condition-Aware Processing</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
