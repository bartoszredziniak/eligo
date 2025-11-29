import { TestBed } from '@angular/core/testing';
import { CostCalculatorService } from './cost-calculator.service';
import { Box } from '../models/drawer.models';

describe('CostCalculatorService', () => {
  let service: CostCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CostCalculatorService);
  });

  it('should be created', () => {
    // Manual calculation check:
    // Width = 16mm, Depth = 16mm, Height = 50mm
    // Wall Thickness = 3mm, Floor Thickness = 3mm
    
    // Wall Effective Thickness:
    // Solid = 1 * 0.4 * 2 = 0.8mm
    // Infill = 3 - 0.8 = 2.2mm
    // Effective = 0.8 + (2.2 * 0.1) = 0.8 + 0.22 = 1.02mm
    
    // Floor Effective Thickness:
    // Solid = 3 * 0.4 * 2 = 2.4mm
    // Infill = 3 - 2.4 = 0.6mm
    // Effective = 2.4 + (0.6 * 0.1) = 2.4 + 0.06 = 2.46mm
    
    // Floor Volume:
    // 16 * 16 * 2.46 = 256 * 2.46 = 629.76 mm³
    
    // Wall Volume:
    // Height = 50 - 3 = 47mm
    // Length = 2*16 + 2*(16 - 2*3) = 32 + 2*(10) = 32 + 20 = 52mm
    // Volume = 52 * 47 * 1.02 = 2444 * 1.02 = 2492.88 mm³
    
    // Total Volume = 629.76 + 2492.88 = 3122.64 mm³
    // Mass = 3122.64 * 0.00124 = 3.8720736 g
    
    expect(mass).toBeCloseTo(3.872, 3);
  });

  it('should calculate price correctly', () => {
    const massInGrams = 1000; // 1kg
    const price = service.calculateBoxPrice(massInGrams);
    expect(price).toBe(150);
  });
});
