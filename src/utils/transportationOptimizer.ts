import type { DetailedAlgorithmExecution } from '@/types/detailedSteps';

export interface Matrix {
  cost: number[][];
  supply: number[];
  demand: number[];
}

export interface AllocationResult {
  allocation: number[][];
  cost: number;
  iterations: number;
  certificate?: {
    u: number[];
    v: number[];
    optimality: boolean;
  };
  detailedSteps?: DetailedAlgorithmExecution;
}

export interface HybridStep {
  name: string;
  description: string;
  initialCost: number;
  finalCost: number;
  iterations: number;
  improvement: number;
}

export interface HybridDetailedResult extends AllocationResult {
  steps: HybridStep[];
  bestApproach: string;
}

export interface PresenceFlags {
  A: boolean; // Has negative entries
  B: boolean; // Has zero entries  
  C: boolean; // Has positive entries
  flagString: string; // "ABC" format like "101"
}

export function computePresenceFlags(cost: number[][]): PresenceFlags {
  let hasNegative = false;
  let hasZero = false;
  let hasPositive = false;

  for (const row of cost) {
    for (const val of row) {
      if (val < 0) hasNegative = true;
      else if (val === 0) hasZero = true;
      else if (val > 0) hasPositive = true;
    }
  }

  return {
    A: hasNegative,
    B: hasZero,
    C: hasPositive,
    flagString: `${hasNegative ? '1' : '0'}${hasZero ? '1' : '0'}${hasPositive ? '1' : '0'}`
  };
}

// Balance unbalanced matrix by adding dummy row or column
export function balanceMatrix(matrix: Matrix): Matrix {
  const totalSupply = matrix.supply.reduce((a, b) => a + b, 0);
  const totalDemand = matrix.demand.reduce((a, b) => a + b, 0);
  
  if (Math.abs(totalSupply - totalDemand) < 1e-6) {
    return matrix; // Already balanced
  }
  
  if (totalSupply > totalDemand) {
    // Add dummy destination
    const diff = totalSupply - totalDemand;
    return {
      cost: matrix.cost.map(row => [...row, 0]), // Add column with 0 cost
      supply: [...matrix.supply],
      demand: [...matrix.demand, diff]
    };
  } else {
    // Add dummy source
    const diff = totalDemand - totalSupply;
    const cols = matrix.cost[0].length;
    return {
      cost: [...matrix.cost, Array(cols).fill(0)], // Add row with 0 cost
      supply: [...matrix.supply, diff],
      demand: [...matrix.demand]
    };
  }
}

export function validateMatrix(matrix: Matrix): { valid: boolean; error?: string; flags: PresenceFlags } {
  const flags = computePresenceFlags(matrix.cost);
  
  // Check for 000 case (degenerate)
  if (flags.flagString === '000') {
    return {
      valid: false,
      error: 'Invalid matrix (000 flag): No numeric entries detected. Please provide valid positive/zero/negative values.',
      flags
    };
  }

  // Validate dimensions
  const rows = matrix.cost.length;
  const cols = matrix.cost[0]?.length || 0;
  
  if (matrix.supply.length !== rows) {
    return { valid: false, error: 'Supply array length must match cost matrix rows', flags };
  }
  
  if (matrix.demand.length !== cols) {
    return { valid: false, error: 'Demand array length must match cost matrix columns', flags };
  }

  return { valid: true, flags };
}

// Northwest Corner Method (Classical)
export function northwestCornerMethod(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  
  let i = 0;
  let j = 0;
  let iterations = 0;

  while (i < m && j < n) {
    const allocAmount = Math.min(remainingSupply[i], remainingDemand[j]);
    allocation[i][j] = allocAmount;
    remainingSupply[i] -= allocAmount;
    remainingDemand[j] -= allocAmount;
    
    if (remainingSupply[i] === 0) i++;
    if (remainingDemand[j] === 0) j++;
    iterations++;
  }

  const totalCost = calculateTotalCost(allocation, cost);
  return { allocation, cost: totalCost, iterations };
}

// Least Cost Method (Classical)
export function leastCostMethod(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  
  let iterations = 0;
  const maxIterations = m * n;

  while (iterations < maxIterations) {
    let minCost = Infinity;
    let minI = -1;
    let minJ = -1;

    for (let i = 0; i < m; i++) {
      if (remainingSupply[i] <= 0) continue;
      for (let j = 0; j < n; j++) {
        if (remainingDemand[j] <= 0) continue;
        if (cost[i][j] < minCost) {
          minCost = cost[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    if (minI === -1) break;

    const allocAmount = Math.min(remainingSupply[minI], remainingDemand[minJ]);
    allocation[minI][minJ] = allocAmount;
    remainingSupply[minI] -= allocAmount;
    remainingDemand[minJ] -= allocAmount;
    
    iterations++;
  }

  const totalCost = calculateTotalCost(allocation, cost);
  return { allocation, cost: totalCost, iterations };
}

// Vogel's Approximation Method (Classical)
export function vogelApproximationMethod(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  const activeRows = Array(m).fill(true);
  const activeCols = Array(n).fill(true);
  
  let iterations = 0;
  const maxIterations = m * n;

  while (iterations < maxIterations) {
    // Calculate penalties for rows
    const rowPenalties: number[] = [];
    for (let i = 0; i < m; i++) {
      if (!activeRows[i] || remainingSupply[i] <= 0) {
        rowPenalties.push(-1);
        continue;
      }
      const costs = [];
      for (let j = 0; j < n; j++) {
        if (activeCols[j] && remainingDemand[j] > 0) {
          costs.push(cost[i][j]);
        }
      }
      if (costs.length >= 2) {
        costs.sort((a, b) => a - b);
        rowPenalties.push(costs[1] - costs[0]);
      } else if (costs.length === 1) {
        rowPenalties.push(costs[0]);
      } else {
        rowPenalties.push(-1);
      }
    }

    // Calculate penalties for columns
    const colPenalties: number[] = [];
    for (let j = 0; j < n; j++) {
      if (!activeCols[j] || remainingDemand[j] <= 0) {
        colPenalties.push(-1);
        continue;
      }
      const costs = [];
      for (let i = 0; i < m; i++) {
        if (activeRows[i] && remainingSupply[i] > 0) {
          costs.push(cost[i][j]);
        }
      }
      if (costs.length >= 2) {
        costs.sort((a, b) => a - b);
        colPenalties.push(costs[1] - costs[0]);
      } else if (costs.length === 1) {
        colPenalties.push(costs[0]);
      } else {
        colPenalties.push(-1);
      }
    }

    // Find max penalty
    const maxRowPenalty = Math.max(...rowPenalties);
    const maxColPenalty = Math.max(...colPenalties);
    
    if (maxRowPenalty < 0 && maxColPenalty < 0) break;

    let selectedI = -1;
    let selectedJ = -1;

    if (maxRowPenalty >= maxColPenalty) {
      const rowIdx = rowPenalties.indexOf(maxRowPenalty);
      let minCost = Infinity;
      for (let j = 0; j < n; j++) {
        if (activeCols[j] && remainingDemand[j] > 0 && cost[rowIdx][j] < minCost) {
          minCost = cost[rowIdx][j];
          selectedI = rowIdx;
          selectedJ = j;
        }
      }
    } else {
      const colIdx = colPenalties.indexOf(maxColPenalty);
      let minCost = Infinity;
      for (let i = 0; i < m; i++) {
        if (activeRows[i] && remainingSupply[i] > 0 && cost[i][colIdx] < minCost) {
          minCost = cost[i][colIdx];
          selectedI = i;
          selectedJ = colIdx;
        }
      }
    }

    if (selectedI === -1) break;

    const allocAmount = Math.min(remainingSupply[selectedI], remainingDemand[selectedJ]);
    allocation[selectedI][selectedJ] = allocAmount;
    remainingSupply[selectedI] -= allocAmount;
    remainingDemand[selectedJ] -= allocAmount;

    if (remainingSupply[selectedI] <= 1e-9) activeRows[selectedI] = false;
    if (remainingDemand[selectedJ] <= 1e-9) activeCols[selectedJ] = false;
    
    iterations++;
  }

  const totalCost = calculateTotalCost(allocation, cost);
  return { allocation, cost: totalCost, iterations };
}

// Classical Manual Methods Combined (Best of three)
export function classicalManualMethods(matrix: Matrix): AllocationResult {
  const nwc = northwestCornerMethod(matrix);
  const lcm = leastCostMethod(matrix);
  const vam = vogelApproximationMethod(matrix);
  
  // Return the best one
  if (lcm.cost <= nwc.cost && lcm.cost <= vam.cost) return lcm;
  if (vam.cost <= nwc.cost) return vam;
  return nwc;
}

// MMR (Min-Min Right) Algorithm
export function mmrAlgorithm(matrix: Matrix): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  
  const allocation: number[][] = Array(m).fill(0).map(() => Array(n).fill(0));
  const remainingSupply = [...supply];
  const remainingDemand = [...demand];
  
  let iterations = 0;
  const maxIterations = m * n;

  while (iterations < maxIterations) {
    // Find minimum cost cell
    let minCost = Infinity;
    let minI = -1;
    let minJ = -1;

    for (let i = 0; i < m; i++) {
      if (remainingSupply[i] <= 0) continue;
      for (let j = 0; j < n; j++) {
        if (remainingDemand[j] <= 0) continue;
        if (cost[i][j] < minCost) {
          minCost = cost[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    if (minI === -1) break;

    // Allocate
    const allocAmount = Math.min(remainingSupply[minI], remainingDemand[minJ]);
    allocation[minI][minJ] = allocAmount;
    remainingSupply[minI] -= allocAmount;
    remainingDemand[minJ] -= allocAmount;
    
    iterations++;
  }

  const totalCost = calculateTotalCost(allocation, cost);
  return { allocation, cost: totalCost, iterations };
}

// MODI Algorithm (with polishing)
export function modiAlgorithm(matrix: Matrix, initialAllocation?: number[][]): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;

  // Use provided allocation or run MMR
  let allocation = initialAllocation || mmrAlgorithm(matrix).allocation;
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Calculate u and v (dual variables)
    const u: number[] = Array(m).fill(NaN);
    const v: number[] = Array(n).fill(NaN);
    u[0] = 0;

    // Find basis variables and compute potentials
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (allocation[i][j] > 0) {
            if (!isNaN(u[i]) && isNaN(v[j])) {
              v[j] = cost[i][j] - u[i];
              changed = true;
            } else if (isNaN(u[i]) && !isNaN(v[j])) {
              u[i] = cost[i][j] - v[j];
              changed = true;
            }
          }
        }
      }
    }

    // Calculate opportunity costs
    let maxImprovement = 0;
    let enterI = -1;
    let enterJ = -1;

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (allocation[i][j] === 0 && !isNaN(u[i]) && !isNaN(v[j])) {
          const improvement = u[i] + v[j] - cost[i][j];
          if (improvement > maxImprovement) {
            maxImprovement = improvement;
            enterI = i;
            enterJ = j;
          }
        }
      }
    }

    if (maxImprovement > 1e-9 && enterI !== -1) {
      // Simple improvement: allocate to best cell
      const minSupply = supply[enterI];
      const minDemand = demand[enterJ];
      allocation[enterI][enterJ] = Math.min(minSupply, minDemand);
      improved = true;
    }
  }

  const totalCost = calculateTotalCost(allocation, cost);
  
  // Recompute certificate
  const u: number[] = Array(m).fill(NaN);
  const v: number[] = Array(n).fill(NaN);
  u[0] = 0;
  
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (allocation[i][j] > 0) {
          if (!isNaN(u[i]) && isNaN(v[j])) {
            v[j] = cost[i][j] - u[i];
            changed = true;
          } else if (isNaN(u[i]) && !isNaN(v[j])) {
            u[i] = cost[i][j] - v[j];
            changed = true;
          }
        }
      }
    }
  }

  const optimality = checkOptimality(allocation, cost, u, v);

  return {
    allocation,
    cost: totalCost,
    iterations,
    certificate: { u, v, optimality }
  };
}

// Simplified GA
export function geneticAlgorithm(matrix: Matrix, generations: number = 50): AllocationResult {
  const balanced = balanceMatrix(matrix);
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  const popSize = 20;

  // Generate initial population
  let population: number[][][] = [];
  for (let p = 0; p < popSize; p++) {
    const individual = mmrAlgorithm(matrix).allocation;
    population.push(individual);
  }

  let bestSolution = population[0];
  let bestCost = calculateTotalCost(bestSolution, cost);

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    const fitness = population.map(ind => {
      const indCost = calculateTotalCost(ind, cost);
      return 1 / (indCost + 1);
    });

    // Selection (tournament)
    const selected: number[][][] = [];
    for (let i = 0; i < popSize; i++) {
      const idx1 = Math.floor(Math.random() * popSize);
      const idx2 = Math.floor(Math.random() * popSize);
      selected.push(fitness[idx1] > fitness[idx2] ? population[idx1] : population[idx2]);
    }

    // Simple mutation
    population = selected.map(ind => {
      if (Math.random() < 0.2) {
        const mutated = ind.map(row => [...row]);
        const i = Math.floor(Math.random() * m);
        const j = Math.floor(Math.random() * n);
        mutated[i][j] = Math.max(0, mutated[i][j] + (Math.random() - 0.5) * 10);
        return mutated;
      }
      return ind.map(row => [...row]);
    });

    // Track best
    for (const ind of population) {
      const indCost = calculateTotalCost(ind, cost);
      if (indCost < bestCost) {
        bestCost = indCost;
        bestSolution = ind;
      }
    }
  }

  return {
    allocation: bestSolution,
    cost: bestCost,
    iterations: generations
  };
}

// Hybrid algorithm: MMR + MODI + GA (tries multiple approaches, picks best)
export function hybridAlgorithm(matrix: Matrix): HybridDetailedResult {
  const balanced = balanceMatrix(matrix);
  const candidates: AllocationResult[] = [];
  const steps: HybridStep[] = [];
  
  // Approach 1: MMR + MODI polish
  const mmrResult = mmrAlgorithm(balanced);
  const mmrModi = modiAlgorithm(balanced, mmrResult.allocation);
  candidates.push(mmrModi);
  steps.push({
    name: "Approach 1: MMR + MODI",
    description: "Min-Min Right algorithm followed by MODI optimization",
    initialCost: mmrResult.cost,
    finalCost: mmrModi.cost,
    iterations: mmrResult.iterations + mmrModi.iterations,
    improvement: mmrResult.cost - mmrModi.cost
  });
  
  // Approach 2: Classical + MODI
  const classicalResult = classicalManualMethods(balanced);
  const classicalModi = modiAlgorithm(balanced, classicalResult.allocation);
  candidates.push(classicalModi);
  steps.push({
    name: "Approach 2: Classical + MODI",
    description: "Best of Northwest/Least Cost/Vogel methods, then MODI polished",
    initialCost: classicalResult.cost,
    finalCost: classicalModi.cost,
    iterations: classicalResult.iterations + classicalModi.iterations,
    improvement: classicalResult.cost - classicalModi.cost
  });
  
  // Approach 3: GA with more generations + MODI polish
  const gaResult1 = geneticAlgorithm(balanced, 100);
  const gaModi1 = modiAlgorithm(balanced, gaResult1.allocation);
  candidates.push(gaModi1);
  steps.push({
    name: "Approach 3: GA (100 gen) + MODI",
    description: "Genetic algorithm with 100 generations, then MODI optimization",
    initialCost: gaResult1.cost,
    finalCost: gaModi1.cost,
    iterations: gaResult1.iterations + gaModi1.iterations,
    improvement: gaResult1.cost - gaModi1.cost
  });
  
  // Approach 4: Another GA run (different random seed) + MODI
  const gaResult2 = geneticAlgorithm(balanced, 80);
  const gaModi2 = modiAlgorithm(balanced, gaResult2.allocation);
  candidates.push(gaModi2);
  steps.push({
    name: "Approach 4: GA (80 gen) + MODI",
    description: "Second GA run with 80 generations (different seed), then MODI",
    initialCost: gaResult2.cost,
    finalCost: gaModi2.cost,
    iterations: gaResult2.iterations + gaModi2.iterations,
    improvement: gaResult2.cost - gaModi2.cost
  });
  
  // Approach 5: Start GA from best MMR result
  const { cost, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;
  const popSize = 30;
  
  // Generate population starting from MMR
  let population: number[][][] = [];
  for (let p = 0; p < popSize; p++) {
    if (p === 0) {
      population.push(mmrResult.allocation.map(row => [...row]));
    } else {
      const individual = mmrAlgorithm(balanced).allocation;
      population.push(individual);
    }
  }
  
  let bestSolution = population[0];
  let bestCost = calculateTotalCost(bestSolution, cost);
  const hybridGAInitialCost = bestCost;
  
  // Run GA iterations
  for (let gen = 0; gen < 100; gen++) {
    const fitness = population.map(ind => {
      const indCost = calculateTotalCost(ind, cost);
      return 1 / (indCost + 1);
    });
    
    const selected: number[][][] = [];
    for (let i = 0; i < popSize; i++) {
      const idx1 = Math.floor(Math.random() * popSize);
      const idx2 = Math.floor(Math.random() * popSize);
      selected.push(fitness[idx1] > fitness[idx2] ? population[idx1] : population[idx2]);
    }
    
    population = selected.map(ind => {
      if (Math.random() < 0.3) {
        const mutated = ind.map(row => [...row]);
        const i = Math.floor(Math.random() * m);
        const j = Math.floor(Math.random() * n);
        mutated[i][j] = Math.max(0, mutated[i][j] + (Math.random() - 0.5) * 15);
        return mutated;
      }
      return ind.map(row => [...row]);
    });
    
    for (const ind of population) {
      const indCost = calculateTotalCost(ind, cost);
      if (indCost < bestCost) {
        bestCost = indCost;
        bestSolution = ind;
      }
    }
  }
  
  const hybridGA = modiAlgorithm(balanced, bestSolution);
  candidates.push(hybridGA);
  steps.push({
    name: "Approach 5: Hybrid GA + MODI",
    description: "GA seeded with MMR result (100 gen, pop=30), then MODI",
    initialCost: hybridGAInitialCost,
    finalCost: hybridGA.cost,
    iterations: 100 + hybridGA.iterations,
    improvement: hybridGAInitialCost - hybridGA.cost
  });
  
  // Find and return the absolute best
  let bestCandidate = candidates[0];
  let bestApproachIndex = 0;
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].cost < bestCandidate.cost) {
      bestCandidate = candidates[i];
      bestApproachIndex = i;
    }
  }
  
  return {
    ...bestCandidate,
    steps,
    bestApproach: steps[bestApproachIndex].name
  };
}

// Helper functions
function calculateTotalCost(allocation: number[][], cost: number[][]): number {
  let total = 0;
  for (let i = 0; i < allocation.length; i++) {
    for (let j = 0; j < allocation[0].length; j++) {
      total += allocation[i][j] * cost[i][j];
    }
  }
  return total;
}

function checkOptimality(
  allocation: number[][],
  cost: number[][],
  u: number[],
  v: number[]
): boolean {
  const m = allocation.length;
  const n = allocation[0].length;

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (!isNaN(u[i]) && !isNaN(v[j])) {
        if (allocation[i][j] === 0 && u[i] + v[j] - cost[i][j] > 1e-9) {
          return false;
        }
      }
    }
  }
  return true;
}

// Generate sample matrices
export function generateSampleMatrix(type: 'simple' | 'with-zeros' | 'with-negatives'): Matrix {
  switch (type) {
    case 'simple':
      return {
        cost: [
          [10, 20, 15],
          [12, 18, 10],
          [8, 25, 20]
        ],
        supply: [100, 150, 120],
        demand: [120, 130, 120]
      };
    
    case 'with-zeros':
      return {
        cost: [
          [0, 5, 10],
          [8, 0, 12],
          [15, 20, 0]
        ],
        supply: [80, 100, 90],
        demand: [90, 95, 85]
      };
    
    case 'with-negatives':
      return {
        cost: [
          [-5, 10, 8],
          [12, -3, 15],
          [7, 20, -2]
        ],
        supply: [60, 80, 70],
        demand: [70, 75, 65]
      };
    
    default:
      return generateSampleMatrix('simple');
  }
}
