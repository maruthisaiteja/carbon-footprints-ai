import { describe, test, expect, vi, beforeEach } from 'vitest';

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

// Mock @google/generative-ai
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor(apiKey) {
        this.apiKey = apiKey;
      }
      getGenerativeModel() {
        return {
          generateContent: async () => ({
            response: {
              text: () => "Mocked Gemini Response - Plant-based food reduces footprint."
            }
          }),
          startChat: () => ({
            sendMessage: async () => ({
              response: {
                text: () => "Mocked Gemini Response - Live carbon suggestions."
              }
            })
          })
        };
      }
    }
  };
});

// Import SDK methods to test
import { getGeminiApiKey, saveGeminiApiKey, clearGeminiApiKey, queryGeminiAssistant } from '../gemini.js';

describe('Google Gemini AI SDK integration', () => {

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  test('Gemini key lifecycle methods work correctly', () => {
    // 1. Initial State (no key)
    expect(getGeminiApiKey()).toBe(null);

    // 2. Reject invalid key formats (not starting with AIzaSy)
    expect(saveGeminiApiKey('invalid_key_123')).toBe(false);
    expect(getGeminiApiKey()).toBe(null);

    // 3. Save correct key format
    const validKey = 'AIzaSyMockGeminiKey_123';
    expect(saveGeminiApiKey(validKey)).toBe(true);
    expect(getGeminiApiKey()).toBe(validKey);

    // 4. Clear key
    clearGeminiApiKey();
    expect(getGeminiApiKey()).toBe(null);
  });

  test('queryGeminiAssistant falls back to null if no API key is set', async () => {
    const mockState = {
      selectedPersona: 'foodie',
      logs: [],
      totalSavedCo2: 0,
      xp: 100,
      baselineFootprint: { total: 4.8 }
    };

    const response = await queryGeminiAssistant("What is my carbon footprint?", mockState);
    expect(response).toBe(null); // falls back to rules
  });

  test('queryGeminiAssistant returns generative AI text if API key is connected', async () => {
    saveGeminiApiKey('AIzaSyMockGeminiKey_123');
    
    const mockState = {
      selectedPersona: 'foodie',
      logs: [{ date: '2026-06-20', category: 'diet', note: 'Meal', co2: 6.2 }],
      totalSavedCo2: 0,
      xp: 100,
      baselineFootprint: { total: 4.8 }
    };

    const response = await queryGeminiAssistant("What is my carbon footprint?", mockState);
    expect(response).toBe("Mocked Gemini Response - Live carbon suggestions.");
  });
});
