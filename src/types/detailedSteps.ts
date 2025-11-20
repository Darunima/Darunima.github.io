// Detailed step-by-step mathematical logging for transportation algorithms

export interface CalculationStep {
  step: number;
  operation: string;
  description: string;
  formula?: string;
  result?: string | number;
  matrixState?: number[][];
  highlightCells?: { row: number; col: number }[];
}

export interface AlgorithmPhase {
  phaseName: string;
  phaseDescription: string;
  steps: CalculationStep[];
}

export interface DetailedAlgorithmExecution {
  algorithmName: string;
  initialState: {
    costMatrix: number[][];
    supply: number[];
    demand: number[];
    totalSupply: number;
    totalDemand: number;
  };
  phases: AlgorithmPhase[];
  finalState: {
    allocation: number[][];
    totalCost: number;
    isOptimal: boolean;
  };
}
