import type { Matrix, AllocationResult } from './transportationOptimizer';
import type { DetailedAlgorithmExecution, AlgorithmPhase, CalculationStep } from '@/types/detailedSteps';
import { balanceMatrix } from './transportationOptimizer';

// Detailed Least Cost Method with step-by-step mathematical explanations
export function leastCostMethodDetailed(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const detailedSteps: DetailedAlgorithmExecution = {
    algorithmName: "Least Cost Method",
    initialState: {
      costMatrix: cost.map(row => [...row]),
      supply: [...supply],
      demand: [...demand],
      totalSupply: supply.reduce((a, b) => a + b, 0),
      totalDemand: demand.reduce((a, b) => a + b, 0)
    },
    phases: [],
    finalState: {
      allocation: [],
      totalCost: 0,
      isOptimal: false
    }
  };

  // Phase 1: Initialization
  const initPhase: AlgorithmPhase = {
    phaseName: "Initialization",
    phaseDescription: "Setting up the problem and verifying balance",
    steps: []
  };

  initPhase.steps.push({
    step: 1,
    operation: "Verify Supply-Demand Balance",
    description: "Check if total supply equals total demand",
    formula: `ΣSupply = ${supply.map((s, i) => `S${i + 1}`).join(' + ')} = ${supply.join(' + ')}`,
    result: detailedSteps.initialState.totalSupply
  });

  initPhase.steps.push({
    step: 2,
    operation: "Verify Supply-Demand Balance",
    description: "Check if total supply equals total demand",
    formula: `ΣDemand = ${demand.map((d, i) => `D${i + 1}`).join(' + ')} = ${demand.join(' + ')}`,
    result: detailedSteps.initialState.totalDemand
  });

  initPhase.steps.push({
    step: 3,
    operation: "Balance Check",
    description: detailedSteps.initialState.totalSupply === detailedSteps.initialState.totalDemand 
      ? "Problem is balanced ✓" 
      : "Problem was auto-balanced by adding dummy source/destination",
    formula: `Total Supply ${detailedSteps.initialState.totalSupply === detailedSteps.initialState.totalDemand ? '=' : '≠'} Total Demand`,
    result: detailedSteps.initialState.totalSupply === detailedSteps.initialState.totalDemand ? "Balanced" : "Auto-balanced"
  });

  detailedSteps.phases.push(initPhase);

  // Phase 2: Allocation Process
  const allocationPhase: AlgorithmPhase = {
    phaseName: "Least Cost Allocation",
    phaseDescription: "Allocate to cells with minimum cost iteratively",
    steps: []
  };

  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  
  let iterations = 0;
  const maxIterations = m * n;
  let stepCount = 1;

  while (iterations < maxIterations) {
    // Find minimum cost cell
    let minCost = Infinity;
    let minI = -1;
    let minJ = -1;
    const cellsConsidered: string[] = [];

    for (let i = 0; i < m; i++) {
      if (remainingSupply[i] <= 0) continue;
      for (let j = 0; j < n; j++) {
        if (remainingDemand[j] <= 0) continue;
        cellsConsidered.push(`C[${i + 1},${j + 1}]=${cost[i][j]}`);
        if (cost[i][j] < minCost) {
          minCost = cost[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    if (minI === -1) break;

    // Log the cell selection
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Iteration ${iterations + 1}: Find Minimum Cost`,
      description: `Scanning all available cells with remaining supply and demand`,
      formula: `Available cells: ${cellsConsidered.join(', ')}`,
      result: `Minimum cost = ${minCost} at cell (${minI + 1}, ${minJ + 1})`,
      highlightCells: [{ row: minI, col: minJ }]
    });

    // Calculate allocation amount
    const allocAmount = Math.min(remainingSupply[minI], remainingDemand[minJ]);
    
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Calculate Allocation`,
      description: `Allocate the minimum of remaining supply and demand`,
      formula: `min(Supply[${minI + 1}], Demand[${minJ + 1}]) = min(${remainingSupply[minI]}, ${remainingDemand[minJ]})`,
      result: allocAmount
    });

    allocation[minI][minJ] = allocAmount;
    
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Allocate to Cell (${minI + 1}, ${minJ + 1})`,
      description: `Assign ${allocAmount} units to cell (${minI + 1}, ${minJ + 1})`,
      formula: `X[${minI + 1},${minJ + 1}] = ${allocAmount}`,
      result: `Cost contribution: ${allocAmount} × ${cost[minI][minJ]} = ${allocAmount * cost[minI][minJ]}`,
      matrixState: allocation.map(row => [...row]),
      highlightCells: [{ row: minI, col: minJ }]
    });

    // Update remaining supply and demand
    const oldSupply = remainingSupply[minI];
    const oldDemand = remainingDemand[minJ];
    remainingSupply[minI] -= allocAmount;
    remainingDemand[minJ] -= allocAmount;
    
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Update Remaining Values`,
      description: `Subtract allocated amount from supply and demand`,
      formula: `Supply[${minI + 1}]: ${oldSupply} - ${allocAmount} = ${remainingSupply[minI]}\nDemand[${minJ + 1}]: ${oldDemand} - ${allocAmount} = ${remainingDemand[minJ]}`,
      result: remainingSupply[minI] === 0 ? `Source ${minI + 1} exhausted` : remainingDemand[minJ] === 0 ? `Destination ${minJ + 1} satisfied` : "Continue"
    });
    
    iterations++;
  }

  detailedSteps.phases.push(allocationPhase);

  // Phase 3: Calculate Total Cost
  const costPhase: AlgorithmPhase = {
    phaseName: "Total Cost Calculation",
    phaseDescription: "Sum up all cost contributions from allocated cells",
    steps: []
  };

  let totalCost = 0;
  const costTerms: string[] = [];
  
  costPhase.steps.push({
    step: 1,
    operation: "Calculate Total Transportation Cost",
    description: "Multiply each allocation by its unit cost and sum",
    formula: "Total Cost = Σ(Allocation[i,j] × Cost[i,j]) for all allocated cells"
  });

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (allocation[i][j] > 0) {
        const cellCost = allocation[i][j] * cost[i][j];
        totalCost += cellCost;
        costTerms.push(`(${allocation[i][j]} × ${cost[i][j]})`);
        
        costPhase.steps.push({
          step: costPhase.steps.length + 1,
          operation: `Cell (${i + 1}, ${j + 1})`,
          description: `Contribution from cell (${i + 1}, ${j + 1})`,
          formula: `${allocation[i][j]} × ${cost[i][j]}`,
          result: cellCost,
          highlightCells: [{ row: i, col: j }]
        });
      }
    }
  }

  costPhase.steps.push({
    step: costPhase.steps.length + 1,
    operation: "Sum All Contributions",
    description: "Add up all individual cell costs",
    formula: costTerms.join(' + '),
    result: totalCost
  });

  detailedSteps.phases.push(costPhase);

  // Final State
  detailedSteps.finalState = {
    allocation: allocation.map(row => [...row]),
    totalCost,
    isOptimal: false
  };

  return { 
    allocation, 
    cost: totalCost, 
    iterations,
    detailedSteps
  };
}

// Detailed Northwest Corner Method
export function northwestCornerMethodDetailed(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const detailedSteps: DetailedAlgorithmExecution = {
    algorithmName: "Northwest Corner Method",
    initialState: {
      costMatrix: cost.map(row => [...row]),
      supply: [...supply],
      demand: [...demand],
      totalSupply: supply.reduce((a, b) => a + b, 0),
      totalDemand: demand.reduce((a, b) => a + b, 0)
    },
    phases: [],
    finalState: {
      allocation: [],
      totalCost: 0,
      isOptimal: false
    }
  };

  // Phase 1: Initialization
  const initPhase: AlgorithmPhase = {
    phaseName: "Initialization",
    phaseDescription: "Northwest Corner Method starts from cell (1,1) and moves right/down",
    steps: [{
      step: 1,
      operation: "Start Position",
      description: "Begin at the northwest (top-left) corner of the matrix",
      result: "Starting at cell (1, 1)"
    }]
  };
  detailedSteps.phases.push(initPhase);

  // Phase 2: Allocation
  const allocationPhase: AlgorithmPhase = {
    phaseName: "Sequential Allocation",
    phaseDescription: "Allocate moving from northwest to southeast",
    steps: []
  };

  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  
  let i = 0;
  let j = 0;
  let iterations = 0;
  let stepCount = 1;

  while (i < m && j < n) {
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Iteration ${iterations + 1}: At Cell (${i + 1}, ${j + 1})`,
      description: `Current position in the matrix`,
      formula: `Supply[${i + 1}] = ${remainingSupply[i]}, Demand[${j + 1}] = ${remainingDemand[j]}`,
      highlightCells: [{ row: i, col: j }]
    });

    const allocAmount = Math.min(remainingSupply[i], remainingDemand[j]);
    
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Calculate Allocation`,
      description: `Take minimum of available supply and demand`,
      formula: `min(${remainingSupply[i]}, ${remainingDemand[j]})`,
      result: allocAmount
    });

    allocation[i][j] = allocAmount;
    
    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Allocate ${allocAmount} units`,
      description: `Assign to cell (${i + 1}, ${j + 1})`,
      formula: `X[${i + 1},${j + 1}] = ${allocAmount}`,
      result: `Cost: ${allocAmount} × ${cost[i][j]} = ${allocAmount * cost[i][j]}`,
      matrixState: allocation.map(row => [...row]),
      highlightCells: [{ row: i, col: j }]
    });

    const supplyExhausted = remainingSupply[i] === allocAmount;
    const demandSatisfied = remainingDemand[j] === allocAmount;

    remainingSupply[i] -= allocAmount;
    remainingDemand[j] -= allocAmount;
    
    let moveDirection = "";
    if (supplyExhausted && demandSatisfied) {
      moveDirection = "Both exhausted - move diagonally (or right)";
      i++;
      j++;
    } else if (supplyExhausted) {
      moveDirection = "Supply exhausted - move down to next row";
      i++;
    } else if (demandSatisfied) {
      moveDirection = "Demand satisfied - move right to next column";
      j++;
    }

    allocationPhase.steps.push({
      step: stepCount++,
      operation: `Update and Move`,
      description: moveDirection,
      formula: `New position: (${Math.min(i + 1, m)}, ${Math.min(j + 1, n)})`,
      result: i >= m || j >= n ? "All allocations complete" : "Continue"
    });
    
    iterations++;
  }

  detailedSteps.phases.push(allocationPhase);

  // Calculate total cost
  let totalCost = 0;
  const costPhase: AlgorithmPhase = {
    phaseName: "Cost Calculation",
    phaseDescription: "Calculate total transportation cost",
    steps: []
  };

  const costTerms: string[] = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (allocation[i][j] > 0) {
        const cellCost = allocation[i][j] * cost[i][j];
        totalCost += cellCost;
        costTerms.push(`(${allocation[i][j]}×${cost[i][j]})`);
        costPhase.steps.push({
          step: costPhase.steps.length + 1,
          operation: `Cell (${i + 1}, ${j + 1})`,
          description: `Cost contribution from allocated cell`,
          formula: `${allocation[i][j]} × ${cost[i][j]}`,
          result: cellCost
        });
      }
    }
  }

  costPhase.steps.push({
    step: costPhase.steps.length + 1,
    operation: "Total Cost",
    description: "Sum of all cell contributions",
    formula: costTerms.join(' + '),
    result: totalCost
  });

  detailedSteps.phases.push(costPhase);
  detailedSteps.finalState = {
    allocation: allocation.map(row => [...row]),
    totalCost,
    isOptimal: false
  };

  return { allocation, cost: totalCost, iterations, detailedSteps };
}
