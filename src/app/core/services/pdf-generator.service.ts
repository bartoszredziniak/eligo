import { Injectable, inject } from '@angular/core';
import { Box, DrawerConfig, BoxColor } from '../models/drawer.models';
import { CostCalculatorService } from './cost-calculator.service';
import { GridService } from './grid.service';

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService {
  private readonly costCalculator = inject(CostCalculatorService);
  private readonly gridService = inject(GridService);
  private pdfMakeInitialized = false;

  /**
   * Generate order PDF with full drawer visualization and box details
   */
  async generateOrderPdf(
    drawerConfig: DrawerConfig,
    boxes: Box[],
    drawerImageBase64: string
  ): Promise<void> {
    // Lazy load pdfMake only when needed
    if (!this.pdfMakeInitialized) {
      await this.initializePdfMake();
    }

    const cellSize = this.gridService.cellSize();

    // Calculate individual box data
    const boxesData = boxes.map((box) => {
      const mass = this.costCalculator.calculateBoxMass(box, cellSize);
      const price = this.costCalculator.calculateBoxPrice(mass);
      const coords = this.gridService.convertBoxToMm(box);
      
      return {
        box,
        mass,
        price,
        coords,
      };
    });

    const totalMass = boxesData.reduce((sum, b) => sum + b.mass, 0);
    const totalPrice = this.costCalculator.calculateBoxPrice(totalMass);

    const docDefinition = this.buildPdfStructure(
      drawerConfig,
      boxesData,
      totalMass,
      totalPrice,
      drawerImageBase64
    );

    (window as any).pdfMake.createPdf(docDefinition).download('eligo-zamowienie.pdf');
  }

  /**
   * Initialize pdfMake with fonts (lazy loaded)
   */
  private async initializePdfMake(): Promise<void> {
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    
    (window as any).pdfMake = pdfMake;
    (pdfMake as any).vfs = (pdfFonts as any).default || (pdfFonts as any).pdfMake?.vfs || pdfFonts;
    
    this.pdfMakeInitialized = true;
  }

  /**
   * Build PDF document structure
   */
  private buildPdfStructure(
    drawerConfig: DrawerConfig,
    boxesData: { box: Box; mass: number; price: number; coords: { x: number; y: number; width: number; height: number; depth: number } }[],
    totalMass: number,
    totalPrice: number,
    drawerImageBase64: string
  ): any {
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      
      header: {
        text: 'Eligo - Zamówienie',
        style: 'header',
        margin: [40, 20, 40, 0],
      },

      content: [
        // Header
        {
          text: 'Eligo - Zamówienie',
          style: 'header',
          margin: [40, 20, 40, 10],
        },

        // Content Row: Image + Config
        {
          columns: [
            // Left: Image
            {
              image: drawerImageBase64,
              width: 220,
              alignment: 'center',
            },
            // Right: Compact Config
            {
              width: '*',
              margin: [20, 10, 0, 0],
              stack: [
                { text: 'Konfiguracja', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                {
                  text: [
                    { text: 'Wymiary: ', bold: true },
                    `${drawerConfig.width} × ${drawerConfig.depth} × ${drawerConfig.height} mm`
                  ],
                  margin: [0, 0, 0, 2],
                  fontSize: 10
                },
                {
                  text: [
                    { text: 'Liczba elementów: ', bold: true },
                    `${boxesData.length}`
                  ],
                  fontSize: 10
                },
                {
                   text: [
                     { text: 'Całkowita masa: ', bold: true },
                     `${totalMass.toFixed(1)} g`
                   ],
                   margin: [0, 10, 0, 2],
                   fontSize: 10
                },
                {
                   text: [
                     { text: 'Całkowity koszt: ', bold: true },
                     `${totalPrice.toFixed(2)} PLN`
                   ],
                   style: 'totalPrice'
                }
              ]
            }
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20]
        },

        // Box list
        {
          text: 'Lista Elementów',
          style: 'sectionHeader',
        },
        
        // Create table with boxes
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 70, 80],
            body: [
              // Header row
              [
                { text: '#', style: 'tableHeader' },
                { text: 'Szczegóły', style: 'tableHeader' },
                { text: 'Masa', style: 'tableHeader' },
                { text: 'Cena', style: 'tableHeader' },
              ],
              // Box rows
              ...boxesData.map((data, index) => [
                { text: `${index + 1}`, style: 'tableCell' },
                {
                  stack: [
                    { text: `Wymiary: ${data.coords.width.toFixed(0)}mm × ${data.coords.depth.toFixed(0)}mm × ${data.coords.height.toFixed(0)}mm`, style: 'details' },
                    { text: `Kolor: ${this.getColorLabel(data.box.color)}`, style: 'details', margin: [0, 2, 0, 0] as [number, number, number, number] },
                  ],
                  style: 'tableCell',
                },
                { text: `${data.mass.toFixed(1)}g`, style: 'tableCell' },
                { text: `${data.price.toFixed(2)} PLN`, style: 'tableCellPrice' },
              ])
            ] as any,
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
          },
          margin: [0, 10, 0, 20],
        },



        // Footer note
        {
          text: 'Wygenerowano przez Eligo - Konfigurator Szuflad',
          style: 'footer',
          margin: [0, 40, 0, 0],
          alignment: 'center',
        },
      ],

      styles: {
        header: {
          fontSize: 20,
          bold: true,
          color: '#1f2937',
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#374151',
          margin: [0, 15, 0, 10],
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#374151',
          fillColor: '#f9fafb',
        },
        tableCell: {
          fontSize: 9,
          color: '#1f2937',
        },
        tableCellPrice: {
          fontSize: 10,
          bold: true,
          color: '#2563eb',
        },
        details: {
          fontSize: 9,
          color: '#6b7280',
        },
        summaryLabel: {
          fontSize: 11,
          color: '#374151',
        },
        summaryValue: {
          fontSize: 11,
          color: '#1f2937',
        },
        summaryTotal: {
          fontSize: 14,
          bold: true,
          color: '#2563eb',
        },
        totalPrice: {
          fontSize: 12,
          bold: true,
          color: '#2563eb',
        },
        footer: {
          fontSize: 8,
          color: '#9ca3af',
          italics: true,
        },
      },
    };
  }

  /**
   * Get the Polish label for a box color
   */
  private getColorLabel(color: BoxColor): string {
    const colorMap: Record<BoxColor, string> = {
      'black': 'Czarny',
      'white': 'Biały',
      'beige': 'Beżowy',
      'light-gray': 'Jasny Szary',
      'dark-gray': 'Ciemny Szary',
    };
    return colorMap[color] || color;
  }
}

