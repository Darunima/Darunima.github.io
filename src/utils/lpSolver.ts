import type { Matrix } from '@/utils/transportationOptimizer';
import { balanceMatrix } from '@/utils/transportationOptimizer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - CommonJS export from javascript-lp-solver
import * as Solver from 'javascript-lp-solver';

export interface LPSolution {
  allocation: number[][];
  cost: number;
}

const TOL = 1e-6;

// Solve transportation LP exactly using javascript-lp-solver (continuous LP)
export function solveTransportationLP(matrix: Matrix): LPSolution {
  const balanced = balanceMatrix(matrix);
  const { cost: C, supply, demand } = balanced;
  const m = supply.length;
  const n = demand.length;

  // Build LP model
  const constraints: Record<string, any> = {};
  for (let i = 0; i < m; i++) constraints[`row_${i}`] = { equal: supply[i] };
  for (let j = 0; j < n; j++) constraints[`col_${j}`] = { equal: demand[j] };

  const variables: Record<string, any> = {};
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const name = `x_${i}_${j}`;
      variables[name] = {
        cost: C[i][j],
        [`row_${i}`]: 1,
        [`col_${j}`]: 1,
      };
    }
  }

  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints,
    variables,
  } as const;

  const res = (Solver as any).Solve(model);
  const allocation: number[][] = Array(m)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Extract solution variables back into matrix form
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const name = `x_${i}_${j}`;
      const val = typeof res[name] === 'number' ? res[name] : 0;
      allocation[i][j] = Math.max(0, val);
    }
  }

  // Prefer solver's objective value if present
  let obj = typeof res.result === 'number' ? res.result : NaN;
  if (!isFinite(obj)) {
    obj = 0;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) obj += allocation[i][j] * C[i][j];
    }
  }

  return { allocation, cost: obj };
}
