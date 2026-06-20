import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Import components to test integration
import { stateManager } from '../state.js';
import { getAssistantResponse } from '../assistant.js';

describe('EcoSphere User Integration Flow', () => {

  beforeEach(() => {
    localStorageMock.clear();
    stateManager.reset();
    stateManager.init();
  });

  test('E2E Onboarding, Logging, Challenges, and Coach Flow', async () => {
    // 1. Initial State checks
    expect(stateManager.state.isOnboarded).toBe(false);

    // 2. Perform Onboarding for "Conscious Foodie"
    const foodieBaselineAnswers = {
      dietStyle: 'highMeat', // baseline starts with meat heavy
      foodWastePct: '15',
      clothingItemsPerMonth: 2
    };

    stateManager.setOnboarding('foodie', foodieBaselineAnswers);

    // Verify Onboarding completed successfully
    expect(stateManager.state.isOnboarded).toBe(true);
    expect(stateManager.state.selectedPersona).toBe('foodie');
    expect(stateManager.state.xp).toBe(100);
    expect(stateManager.state.baselineFootprint.total).toBeGreaterThan(0);
    
    // Save current baseline
    const baselineTons = stateManager.state.baselineFootprint.total;

    // 3. User Commutes to a Local Farmers Market (Transport: train, 15km)
    // Train coefficient: 0.015 kg/km -> 15 * 0.015 = 0.225 kg CO2e
    stateManager.addLogEntry('transport', 'train', 15, 'Commute to Farmers Market');

    // 4. User Prepares a Beef Meal (Diet: beefLamb, 1 meal)
    // Beef coefficient: 6.20 kg/meal -> 1 * 6.2 = 6.2 kg CO2e
    stateManager.addLogEntry('diet', 'beefLamb', 1, 'Sunday Roast');

    // Verify Tracked logs
    expect(stateManager.state.logs.length).toBe(2);
    expect(stateManager.state.xp).toBe(120); // 100 base + 2 logs * 10 XP = 120

    // Verify total tracked carbon
    const totalTracked = stateManager.getTotalTrackedEmissions();
    expect(totalTracked).toBe(0.225 + 6.200); // 6.425 kg CO2e

    // Verify category breakdown
    const categories = stateManager.getEmissionsByCategory();
    expect(categories.transport).toBe(0.23); // rounded to 2 decimals
    expect(categories.diet).toBe(6.20);

    // 5. AI Coach Context Analysis
    // Let's ask the coach "how am i doing" and verify it responds with our exact data
    const queryResponse = getAssistantResponse('how am i doing', stateManager.state);
    
    expect(queryResponse).toContain('Conscious Foodie');
    expect(queryResponse).toContain('6.42 kg'); // Contains current logged amount (rounded to 2 decimals in assistant)
    expect(queryResponse).toContain(`${baselineTons} tons`); // Contains baseline tons

    // 6. User resolves to reduce impact and completes 'Fully Plant-Based Day' challenge
    // Plant-based Day saves 4.8 kg CO2e and earns 20 XP
    stateManager.completeChallenge('foodie_plant_day');

    // Verify rewards accumulated
    expect(stateManager.state.completedChallenges['foodie_plant_day']).toBe(1);
    expect(stateManager.state.totalSavedCo2).toBe(4.8);
    expect(stateManager.state.xp).toBe(140); // 120 + 20 XP challenge reward = 140

    // Verify savings log entry appended (negative co2 emission)
    expect(stateManager.state.logs.length).toBe(3);
    expect(stateManager.state.logs[0].category).toBe('challenge');
    expect(stateManager.state.logs[0].co2).toBe(-4.8);

    // 7. Delete a mistaken log entry (User removes the train commute log)
    const trainLogId = stateManager.state.logs.find(l => l.type === 'train').id;
    stateManager.deleteLogEntry(trainLogId);

    // Verify logs updated
    expect(stateManager.state.logs.length).toBe(2); // roast + challenge savings
    expect(stateManager.getTotalTrackedEmissions()).toBe(6.200); // 6.200 kg CO2e left
  });
});
