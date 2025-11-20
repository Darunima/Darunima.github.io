import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, RefreshCw } from 'lucide-react';
import { Matrix, generateSampleMatrix } from '@/utils/transportationOptimizer';
import { useToast } from '@/hooks/use-toast';

interface MatrixInputProps {
  onMatrixReady: (matrix: Matrix) => void;
}

export function MatrixInput({ onMatrixReady }: MatrixInputProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cost, setCost] = useState<string[][]>(
    Array(3).fill(null).map(() => Array(3).fill('0'))
  );
  const [supply, setSupply] = useState<string[]>(Array(3).fill('100'));
  const [demand, setDemand] = useState<string[]>(Array(3).fill('100'));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "Image Upload",
        description: "OCR processing would extract matrix data here. Using sample data for demo.",
      });
      loadSampleMatrix('simple');
    }
  };

  const loadSampleMatrix = (type: 'simple' | 'with-zeros' | 'with-negatives') => {
    const sample = generateSampleMatrix(type);
    setRows(sample.cost.length);
    setCols(sample.cost[0].length);
    setCost(sample.cost.map(row => row.map(v => v.toString())));
    setSupply(sample.supply.map(v => v.toString()));
    setDemand(sample.demand.map(v => v.toString()));
  };

  const handleDimensionChange = (newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    
    const newCost = Array(newRows).fill(null).map((_, i) =>
      Array(newCols).fill(null).map((_, j) => 
        cost[i]?.[j] || '0'
      )
    );
    setCost(newCost);
    
    setSupply(Array(newRows).fill(null).map((_, i) => supply[i] || '100'));
    setDemand(Array(newCols).fill(null).map((_, i) => demand[i] || '100'));
  };

  const handleSubmit = () => {
    try {
      const matrix: Matrix = {
        cost: cost.map(row => row.map(v => parseFloat(v) || 0)),
        supply: supply.map(v => parseFloat(v) || 0),
        demand: demand.map(v => parseFloat(v) || 0)
      };

      // Optional info: allow unbalanced; optimizer will auto-balance
      const totalSupply = matrix.supply.reduce((a, b) => a + b, 0);
      const totalDemand = matrix.demand.reduce((a, b) => a + b, 0);
      if (Math.abs(totalSupply - totalDemand) > 1e-6) {
        toast({
          title: "Auto-balancing applied",
          description: `Supply (${totalSupply}) and Demand (${totalDemand}) differ. A zero-cost dummy ${totalSupply > totalDemand ? 'destination' : 'source'} will be added automatically.`,
        });
      }

      onMatrixReady(matrix);
    } catch (error) {
      toast({
        title: "Invalid Input",
        description: "Please check your matrix values",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 shadow-lg">
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="matrix-upload"
            />
            <Button variant="outline" className="w-full" onClick={() => document.getElementById('matrix-upload')?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Cost Matrix Image
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSampleMatrix('simple')}
              className="flex-1"
            >
              Load Simple Sample
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSampleMatrix('with-zeros')}
              className="flex-1"
            >
              Sample w/ Zeros
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSampleMatrix('with-negatives')}
              className="flex-1"
            >
              Sample w/ Negatives
            </Button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Rows (Sources)</label>
            <Input
              type="number"
              min={2}
              max={10}
              value={rows}
              onChange={(e) => handleDimensionChange(parseInt(e.target.value) || 3, cols)}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Columns (Destinations)</label>
            <Input
              type="number"
              min={2}
              max={10}
              value={cols}
              onChange={(e) => handleDimensionChange(rows, parseInt(e.target.value) || 3)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Cost Matrix */}
        <div>
          <label className="text-sm font-medium mb-2 block">Cost Matrix</label>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {cost.map((row, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  {row.map((val, j) => (
                    <Input
                      key={j}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newCost = [...cost];
                        newCost[i][j] = e.target.value;
                        setCost(newCost);
                      }}
                      className="w-20 text-center"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supply & Demand */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Supply</label>
            {supply.map((val, i) => (
              <Input
                key={i}
                type="number"
                value={val}
                onChange={(e) => {
                  const newSupply = [...supply];
                  newSupply[i] = e.target.value;
                  setSupply(newSupply);
                }}
                className="mb-2"
                placeholder={`Source ${i + 1}`}
              />
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Demand</label>
            {demand.map((val, i) => (
              <Input
                key={i}
                type="number"
                value={val}
                onChange={(e) => {
                  const newDemand = [...demand];
                  newDemand[i] = e.target.value;
                  setDemand(newDemand);
                }}
                className="mb-2"
                placeholder={`Dest ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Optimization Pipelines
        </Button>
      </div>
    </Card>
  );
}
