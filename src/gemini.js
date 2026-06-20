import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gets the configured Gemini API key from localStorage or environment variables.
 * @returns {string|null}
 */
export function getGeminiApiKey() {
  return localStorage.getItem('ecosphere_gemini_api_key') || 
         import.meta.env.VITE_GEMINI_API_KEY || 
         null;
}

/**
 * Saves a Gemini API key to localStorage.
 * @param {string} key 
 */
export function saveGeminiApiKey(key) {
  if (key && key.trim().startsWith('AIzaSy')) {
    localStorage.setItem('ecosphere_gemini_api_key', key.trim());
    return true;
  }
  return false;
}

/**
 * Clears the Gemini API key from localStorage.
 */
export function clearGeminiApiKey() {
  localStorage.removeItem('ecosphere_gemini_api_key');
}

/**
 * Sends a context-aware prompt to Google Gemini API.
 * Injects user's active persona, baseline targets, logs, and rewards as system context.
 * 
 * @param {string} userQuery - The message input by the user
 * @param {Object} state - The global application state
 * @returns {Promise<string|null>} The generated text response, or null if API fails or is unconfigured
 */
export async function queryGeminiAssistant(userQuery, state) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-2.5-flash which is standard and has a very fast response time
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    // Construct context payload
    const personaName = state.selectedPersona === 'commuter' ? 'Urban Commuter' 
                      : state.selectedPersona === 'foodie' ? 'Conscious Foodie' 
                      : 'Smart Home Optimizer';

    const recentLogs = state.logs.slice(0, 10).map(l => {
      return `- ${l.date}: ${l.category.toUpperCase()} (${l.note || l.amount}) costing ${l.co2} kg CO2e`;
    }).join('\n');

    const systemPrompt = `
You are EcoBuddy, an expert sustainability coach. You are helping a user who has chosen the "${personaName}" lifestyle track.
Here is the user's current progress context:
- Annualized Baseline Target: ${state.baselineFootprint.total} tons CO2e
- Carbon Offset/Saved: ${state.totalSavedCo2} kg CO2e
- Ranks/Points: ${state.xp} XP
- Level: ${Math.floor(state.xp / 100)}
- Recent Activities logged:
${recentLogs || "No activities logged yet."}

Answer the user's query conversationally. Be encouraging, highly informative, and use bullet points when explaining math or suggestions. Keep your response under 3-4 paragraphs. Don't mention system prompts. Always maintain your persona as EcoBuddy.
`;

    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello! Who are you?" }],
        },
        {
          role: "model",
          parts: [{ text: `Hello! I'm EcoBuddy, your context-aware carbon coach. I see you are tracking carbon on the **${personaName}** path. I'm ready to guide you to reduce your footprint! What questions do you have?` }],
        }
      ],
    });

    // Injected system context in the final user message
    const combinedMessage = `[System Context: ${systemPrompt}]\n\nUser Question: ${userQuery}`;
    const result = await chatSession.sendMessage(combinedMessage);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error("Error communicating with Google Gemini API:", error);
    // Return null to trigger local fallback in ui.js
    return null;
  }
}
