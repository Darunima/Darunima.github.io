import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HybridStep, AllocationResult } from '@/utils/transportationOptimizer';

interface ExportData {
  steps: HybridStep[];
  bestApproach: string;
  finalAllocation: number[][];
  finalCost: number;
  lpOptimalCost?: number;
}

export function exportToExcel(data: ExportData) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['Transportation Optimization - Hybrid Algorithm Results'],
    [''],
    ['Best Approach', data.bestApproach],
    ['Final Cost', data.finalCost.toFixed(2)],
    ...(data.lpOptimalCost ? [['LP Optimal Cost', data.lpOptimalCost.toFixed(2)]] : []),
    [''],
    ['Approach Comparison'],
    ['Approach', 'Description', 'Initial Cost', 'Final Cost', 'Iterations', 'Improvement'],
    ...data.steps.map(step => [
      step.name,
      step.description,
      step.initialCost.toFixed(2),
      step.finalCost.toFixed(2),
      step.iterations,
      step.improvement.toFixed(2)
    ])
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Style the title
  summarySheet['!cols'] = [
    { wch: 25 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Final Allocation Matrix
  const allocationData = [
    ['Final Allocation Matrix'],
    [''],
    ...data.finalAllocation.map((row, i) => [
      `Source ${i + 1}`,
      ...row.map(val => val.toFixed(2))
    ])
  ];
  
  // Add header row with destination labels
  allocationData.splice(2, 0, [
    '',
    ...data.finalAllocation[0].map((_, j) => `Dest ${j + 1}`)
  ]);
  
  const allocationSheet = XLSX.utils.aoa_to_sheet(allocationData);
  XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Allocation Matrix');

  // Download
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Transportation_Optimization_${timestamp}.xlsx`);
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Transportation Optimization Results', 14, 20);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Hybrid Algorithm - Detailed Analysis', 14, 28);
  
  // Summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 40);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let yPos = 48;
  doc.text(`Best Approach: ${data.bestApproach}`, 14, yPos);
  yPos += 7;
  doc.text(`Final Cost: ${data.finalCost.toFixed(2)}`, 14, yPos);
  
  if (data.lpOptimalCost) {
    yPos += 7;
    doc.text(`LP Optimal Cost: ${data.lpOptimalCost.toFixed(2)}`, 14, yPos);
  }
  
  // Approach comparison table
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Approach Comparison', 14, yPos);
  
  const tableData = data.steps.map(step => [
    step.name,
    step.initialCost.toFixed(2),
    step.finalCost.toFixed(2),
    step.iterations.toString(),
    step.improvement.toFixed(2)
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Approach', 'Initial Cost', 'Final Cost', 'Iterations', 'Improvement']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Add new page for allocation matrix
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Final Allocation Matrix', 14, 20);
  
  // Create allocation table
  const allocationTableData = data.finalAllocation.map((row, i) => [
    `Source ${i + 1}`,
    ...row.map(val => val.toFixed(2))
  ]);
  
  const allocationHeaders = [
    '',
    ...data.finalAllocation[0].map((_, j) => `Dest ${j + 1}`)
  ];
  
  autoTable(doc, {
    startY: 28,
    head: [allocationHeaders],
    body: allocationTableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
    styles: { fontSize: 9, halign: 'right' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' }
    }
  });
  
  // Add approach descriptions on a new page
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Approach Descriptions', 14, 20);
  
  let descYPos = 30;
  data.steps.forEach((step, index) => {
    if (descYPos > 270) {
      doc.addPage();
      descYPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${step.name}`, 14, descYPos);
    
    descYPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(step.description, 180);
    doc.text(splitDescription, 14, descYPos);
    
    descYPos += (splitDescription.length * 5) + 10;
  });
  
  // Download
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`Transportation_Optimization_${timestamp}.pdf`);
}
