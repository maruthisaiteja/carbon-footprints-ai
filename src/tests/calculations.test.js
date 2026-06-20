import { describe, test, expect } from 'vitest';
import { 
  calculateTransportEmissions, 
  calculateDietEmissions, 
  calculateEnergyEmissions, 
  calculateShoppingEmissions,
  estimateBaselineAnnualFootprint,
  EMISSION_FACTORS
} from '../calculations.js';

describe('Carbon Footprint Calculations', () => {
  
  test('calculateTransportEmissions computes correct values', () => {
    // Petrol Car: 0.170 kg CO2e per km
    expect(calculateTransportEmissions('petrolCar', 10)).toBe(1.7);
    expect(calculateTransportEmissions('petrolCar', 0)).toBe(0);
    expect(calculateTransportEmissions('petrolCar', -10)).toBe(0);

    // EV: 0.050 kg CO2e per km
    expect(calculateTransportEmissions('ev', 100)).toBe(5);

    // Bus: 0.035 kg CO2e per km
    expect(calculateTransportEmissions('bus', 20)).toBe(0.7);

    // Default fallback to petrolCar
    expect(calculateTransportEmissions('invalidMode', 10)).toBe(1.7);
  });

  test('calculateDietEmissions computes correct values', () => {
    // Vegan meal: 0.50 kg CO2e per meal
    expect(calculateDietEmissions('vegan', 3)).toBe(1.5);
    expect(calculateDietEmissions('vegan', 0)).toBe(0);
    expect(calculateDietEmissions('vegan', -5)).toBe(0);

    // Beef meal: 6.20 kg CO2e per meal
    expect(calculateDietEmissions('beefLamb', 2)).toBe(12.4);

    // Default fallback to vegetarian (0.85 kg CO2e per meal)
    expect(calculateDietEmissions('unknownFood', 2)).toBe(1.7);
  });

  test('calculateEnergyEmissions computes correct values', () => {
    // Grid electricity: 0.380 kg CO2e per kWh
    expect(calculateEnergyEmissions('gridElectricity', 100)).toBe(38);
    expect(calculateEnergyEmissions('gridElectricity', 0)).toBe(0);
    expect(calculateEnergyEmissions('gridElectricity', -100)).toBe(0);

    // Green electricity: 0.015 kg CO2e per kWh
    expect(calculateEnergyEmissions('greenElectricity', 200)).toBe(3);

    // Default fallback to gridElectricity
    expect(calculateEnergyEmissions('unknownEnergy', 100)).toBe(38);
  });

  test('calculateShoppingEmissions computes correct values', () => {
    // Clothing: 12.5 kg CO2e per item
    expect(calculateShoppingEmissions('clothing', 2)).toBe(25);
    expect(calculateShoppingEmissions('clothing', 0)).toBe(0);
    expect(calculateShoppingEmissions('clothing', -2)).toBe(0);

    // Electronics: 85.0 kg CO2e per item
    expect(calculateShoppingEmissions('electronics', 1)).toBe(85);

    // Default fallback to miscSmall (1.50 kg CO2e)
    expect(calculateShoppingEmissions('unknownItem', 2)).toBe(3.0);
  });

  test('estimateBaselineAnnualFootprint calculates correct annual baseline totals', () => {
    const baselineAnswers = {
      weeklyKm: 200,
      vehicleType: 'petrolCar',
      dietStyle: 'vegan',
      monthlyElectricityKwh: 250,
      electricitySource: 'gridElectricity',
      annualFlightsShort: 2,
      annualFlightsLong: 1,
      clothingItemsPerMonth: 2,
      electronicsPerYear: 1
    };

    const baseline = estimateBaselineAnnualFootprint(baselineAnswers, 'commuter');

    // Expected transport annual tons: 
    // Weekly commute = 200 * 0.170 = 34 kg. Annual commute = 34 * 52 = 1768 kg.
    // Short flights = 2 * 600 * 0.15 = 180 kg. 
    // Long flights = 1 * 4000 * 0.195 = 780 kg. 
    // Total transport = 1768 + 180 + 780 = 2728 kg = 2.73 tons.
    expect(baseline.transport).toBe(2.73);

    // Expected diet annual tons:
    // dietStyle = vegan -> 21 meals per week * 0.5 kg = 10.5 kg. Annual = 10.5 * 52 = 546 kg = 0.55 tons.
    expect(baseline.diet).toBe(0.55);

    // Expected energy annual tons:
    // Monthly = 250 * 0.380 = 95 kg. Annual = 95 * 12 = 1140 kg = 1.14 tons.
    expect(baseline.energy).toBe(1.14);

    // Expected shopping annual tons:
    // Monthly clothing = 2 * 12.5 = 25 kg. Annual clothing = 25 * 12 = 300 kg.
    // Annual electronics = 1 * 85 = 85 kg. 
    // Total shopping = 300 + 85 = 385 kg = 0.39 tons.
    expect(baseline.shopping).toBe(0.39);

    // Total should equal sum of categories (using unrounded figures before rounding)
    expect(baseline.total).toBe(4.8);
  });

  test('calculations handle edge cases, float values, and extreme inputs', () => {
    // Negative inputs must return 0
    expect(calculateTransportEmissions('petrolCar', -100)).toBe(0);
    expect(calculateDietEmissions('vegan', -20)).toBe(0);
    expect(calculateEnergyEmissions('gridElectricity', -500)).toBe(0);
    expect(calculateShoppingEmissions('clothing', -5)).toBe(0);

    // Floating point values must be computed precisely
    expect(calculateTransportEmissions('petrolCar', 12.345)).toBe(2.099); // 12.345 * 0.170 = 2.09865 -> 2.099
    expect(calculateDietEmissions('vegan', 2.5)).toBe(1.25);
    expect(calculateEnergyEmissions('gridElectricity', 15.75)).toBe(5.985); // 15.75 * 0.380 = 5.985

    // Extreme massive values must not trigger infinity or NaNs
    expect(calculateTransportEmissions('petrolCar', 999999999)).toBe(169999999.83);
  });
});
