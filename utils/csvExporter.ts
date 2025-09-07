import type { MaintenanceEntry } from '../types';

function escapeCsvCell(cellData: string | number | undefined): string {
  const cellString = String(cellData ?? '');
  // If the cell contains a comma, double quote, or newline, wrap it in double quotes.
  // Also, double up any existing double quotes.
  if (/[",\n]/.test(cellString)) {
    return `"${cellString.replace(/"/g, '""')}"`;
  }
  return cellString;
}

function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportMaintenanceToCsv(entries: MaintenanceEntry[], fileName: string): void {
  const csvHeader = 'id,vehicleId,dateIso,odometerKm,categories,description,cost\n';
  
  const csvRows = entries.map(e => 
    [
      e.id,
      e.vehicleId,
      e.dateIso,
      e.odometerKm,
      escapeCsvCell(e.categories.join('; ')),
      escapeCsvCell(e.description),
      e.cost,
    ].join(',')
  );

  const csvContent = csvHeader + csvRows.join('\n');
  downloadCsv(csvContent, fileName);
}

export function exportFuelToCsv(entries: MaintenanceEntry[], fileName: string): void {
  const csvHeader = 'id,vehicleId,dateIso,odometerKm,categories,description,cost,liters,pricePerLiter\n';
  
  const csvRows = entries.map(e => 
    [
      e.id,
      e.vehicleId,
      e.dateIso,
      e.odometerKm,
      escapeCsvCell(e.categories.join('; ')),
      escapeCsvCell(e.description),
      e.cost,
      e.liters ?? '',
      e.pricePerLiter ?? '',
    ].join(',')
  );

  const csvContent = csvHeader + csvRows.join('\n');
  downloadCsv(csvContent, fileName);
}