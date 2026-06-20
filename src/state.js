import { 
  estimateBaselineAnnualFootprint, 
  calculateTransportEmissions, 
  calculateDietEmissions, 
  calculateEnergyEmissions, 
  calculateShoppingEmissions 
} from './calculations.js';

import { PERSONAS } from './persona.js';

const STORAGE_KEY = 'ecosphere_user_state';

// Default initial state structure
const DEFAULT_STATE = {
  isOnboarded: false,
  selectedPersona: 'commuter', // 'commuter' | 'foodie' | 'home'
  profileData: {},
  baselineFootprint: { transport: 0, diet: 0, energy: 0, shopping: 0, total: 0 },
  logs: [], // Tracked daily carbon items
  completedChallenges: {}, // challengeId -> count of completions
  totalSavedCo2: 0, // kg CO2e saved from challenges
  xp: 0,
  chatHistory: [],
  theme: 'light'
};

class StateManager {
  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.listeners = [];
  }

  /**
   * Initializes state by reading from localStorage.
   */
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = {
          ...DEFAULT_STATE,
          ...parsed,
          // Ensure nested objects are merged correctly
          baselineFootprint: { ...DEFAULT_STATE.baselineFootprint, ...parsed.baselineFootprint },
          completedChallenges: { ...parsed.completedChallenges },
          profileData: { ...parsed.profileData },
          logs: parsed.logs || [],
          chatHistory: parsed.chatHistory || []
        };
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      this.state = { ...DEFAULT_STATE };
    }
  }

  /**
   * Persists current state to localStorage.
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
    this.notify();
  }

  /**
   * Clears state and localStorage, resetting to defaults.
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE)); // deep copy defaults
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  /**
   * Registers a callback listener to trigger upon state changes.
   * @param {Function} callback 
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Triggers all registered state listeners.
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error('Error in state subscriber:', e);
      }
    }
  }

  /**
   * Submits baseline onboarding answers and calculates initial footprint.
   * @param {string} personaId 
   * @param {Object} answers 
   */
  setOnboarding(personaId, answers) {
    this.state.selectedPersona = personaId;
    this.state.profileData = answers;
    this.state.baselineFootprint = estimateBaselineAnnualFootprint(answers, personaId);
    this.state.isOnboarded = true;
    this.state.xp = 100; // Starting XP for onboarding completion!
    
    // Add introductory message from AI assistant
    const personaTitle = PERSONAS[personaId].title;
    this.state.chatHistory = [
      {
        id: 'initial_ai_msg',
        sender: 'ai',
        text: `Welcome to EcoSphere! I'm EcoBuddy, your virtual carbon coach. I see you selected the **${personaTitle}** track. I estimated your annual carbon baseline is **${this.state.baselineFootprint.total} tons CO₂e**. Let's work together to drive this down! How can I help you today?`,
        timestamp: new Date().toISOString()
      }
    ];

    this.save();
  }

  /**
   * Adds a tracking log entry.
   * @param {string} category - 'transport' | 'diet' | 'energy' | 'shopping'
   * @param {string} type - subcategory/mode key matching calculations factors
   * @param {number} amount - quantity/distance/count
   * @param {string} note - optional description
   */
  addLogEntry(category, type, amount, note = '') {
    let co2 = 0;
    const numAmount = Number(amount);

    switch (category) {
      case 'transport':
        co2 = calculateTransportEmissions(type, numAmount);
        break;
      case 'diet':
        co2 = calculateDietEmissions(type, numAmount);
        break;
      case 'energy':
        co2 = calculateEnergyEmissions(type, numAmount);
        break;
      case 'shopping':
        co2 = calculateShoppingEmissions(type, numAmount);
        break;
      default:
        console.warn(`Unknown category: ${category}`);
    }

    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
      timestamp: new Date().toISOString(),
      category,
      type,
      amount: numAmount,
      co2: Number(co2.toFixed(3)),
      note: note.trim()
    };

    this.state.logs.unshift(newEntry); // Prepend to show newest first
    this.state.xp += 10; // Earn XP for logging!
    this.save();
  }

  /**
   * Deletes a log entry by ID.
   * @param {string} logId 
   */
  deleteLogEntry(logId) {
    this.state.logs = this.state.logs.filter(entry => entry.id !== logId);
    this.save();
  }

  /**
   * Completes a daily carbon-reduction challenge.
   * Increments rewards and logs savings.
   * @param {string} challengeId 
   */
  completeChallenge(challengeId) {
    const persona = PERSONAS[this.state.selectedPersona];
    const challenge = persona.challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Record completion count
    this.state.completedChallenges[challengeId] = (this.state.completedChallenges[challengeId] || 0) + 1;
    
    // Accumulate metrics
    this.state.totalSavedCo2 = Number((this.state.totalSavedCo2 + challenge.co2Saved).toFixed(3));
    this.state.xp += challenge.xp;

    // Add a notice log entry for the positive savings (negative emissions log)
    const newSavingsLog = {
      id: 'savings_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      category: 'challenge',
      type: challengeId,
      amount: 1,
      co2: -challenge.co2Saved, // negative to reflect offset / reduction
      note: `Completed: ${challenge.title}`
    };
    this.state.logs.unshift(newSavingsLog);

    this.save();
  }

  /**
   * Adds a chat message in the EcoBuddy console.
   * @param {string} sender - 'user' | 'ai'
   * @param {string} text 
   */
  addChatMessage(sender, text) {
    this.state.chatHistory.push({
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      sender,
      text: text.trim(),
      timestamp: new Date().toISOString()
    });
    // Cap chat history to last 100 messages to save memory/storage
    if (this.state.chatHistory.length > 100) {
      this.state.chatHistory.shift();
    }
    this.save();
  }

  /**
   * Toggles light and dark themes.
   */
  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    this.save();
  }

  // --- STATS GETTERS ---

  /**
   * Calculates total tracked carbon emissions from logs (excluding savings logs).
   * @returns {number} kg CO2e
   */
  getTotalTrackedEmissions() {
    return this.state.logs
      .filter(l => l.category !== 'challenge')
      .reduce((sum, entry) => sum + entry.co2, 0);
  }

  /**
   * Groups logged emissions by category.
   * @returns {Object} { transport, diet, energy, shopping } in kg CO2e
   */
  getEmissionsByCategory() {
    const totals = { transport: 0, diet: 0, energy: 0, shopping: 0 };
    for (const log of this.state.logs) {
      if (log.category !== 'challenge' && totals[log.category] !== undefined) {
        totals[log.category] += log.co2;
      }
    }
    // Round to 2 decimals
    for (const cat in totals) {
      totals[cat] = Number(totals[cat].toFixed(2));
    }
    return totals;
  }
}

export const stateManager = new StateManager();
