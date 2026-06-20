import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock localStorage before importing state
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

// Import state manager now
import { stateManager } from '../state.js';

describe('Global State Manager', () => {
  
  beforeEach(() => {
    localStorageMock.clear();
    stateManager.reset();
  });

  test('initial state is set correctly', () => {
    expect(stateManager.state.isOnboarded).toBe(false);
    expect(stateManager.state.logs).toEqual([]);
    expect(stateManager.state.xp).toBe(0);
    expect(stateManager.state.totalSavedCo2).toBe(0);
  });

  test('setOnboarding updates state and baseline calculations', () => {
    const answers = {
      weeklyKm: 100,
      vehicleType: 'ev',
      dietStyle: 'vegan',
      monthlyElectricityKwh: 200,
      electricitySource: 'greenElectricity',
      annualFlightsShort: 0,
      annualFlightsLong: 0,
      clothingItemsPerMonth: 0,
      electronicsPerYear: 0
    };

    stateManager.setOnboarding('commuter', answers);

    expect(stateManager.state.isOnboarded).toBe(true);
    expect(stateManager.state.selectedPersona).toBe('commuter');
    expect(stateManager.state.xp).toBe(100); // onboarding reward
    expect(stateManager.state.baselineFootprint.total).toBeGreaterThan(0);
    expect(stateManager.state.chatHistory.length).toBe(1); // intro AI message
    expect(stateManager.state.chatHistory[0].sender).toBe('ai');
  });

  test('addLogEntry adds entries and increases XP', () => {
    // 100 km on Petrol Car = 17 kg CO2e
    stateManager.addLogEntry('transport', 'petrolCar', 100, 'Roadtrip');

    expect(stateManager.state.logs.length).toBe(1);
    expect(stateManager.state.logs[0].category).toBe('transport');
    expect(stateManager.state.logs[0].co2).toBe(17);
    expect(stateManager.state.logs[0].note).toBe('Roadtrip');
    expect(stateManager.state.xp).toBe(10); // logging reward
  });

  test('deleteLogEntry removes correctly', () => {
    stateManager.addLogEntry('transport', 'ev', 50, 'Daily drive');
    const logId = stateManager.state.logs[0].id;
    
    stateManager.addLogEntry('diet', 'vegan', 1, 'Vegan lunch');

    expect(stateManager.state.logs.length).toBe(2);

    stateManager.deleteLogEntry(logId);

    expect(stateManager.state.logs.length).toBe(1);
    expect(stateManager.state.logs[0].category).toBe('diet');
  });

  test('completeChallenge calculates reductions and increments XP', () => {
    // Onboard first
    stateManager.setOnboarding('commuter', { weeklyKm: 100, vehicleType: 'ev' });
    const initialXp = stateManager.state.xp;

    // Complete transit challenge (saves 3.5 kg, worth 15 XP)
    stateManager.completeChallenge('commute_transit');

    expect(stateManager.state.completedChallenges['commute_transit']).toBe(1);
    expect(stateManager.state.totalSavedCo2).toBe(3.5);
    expect(stateManager.state.xp).toBe(initialXp + 15);

    // Added a challenge log entry as savings (negative emissions log)
    expect(stateManager.state.logs.length).toBe(1); // 1 savings log
    expect(stateManager.state.logs[0].category).toBe('challenge');
    expect(stateManager.state.logs[0].co2).toBe(-3.5);
  });

  test('addChatMessage appends to chat history', () => {
    stateManager.addChatMessage('user', 'Hello Coach!');
    expect(stateManager.state.chatHistory.length).toBe(1);
    expect(stateManager.state.chatHistory[0].sender).toBe('user');
    expect(stateManager.state.chatHistory[0].text).toBe('Hello Coach!');
  });
});
