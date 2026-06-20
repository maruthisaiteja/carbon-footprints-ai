import { PERSONAS } from './persona.js';

// Structured knowledge base for the AI Assistant (EcoBuddy)
const KNOWLEDGE_BASE = {
  transport: {
    keywords: ['car', 'travel', 'bus', 'train', 'flight', 'plane', 'bike', 'drive', 'ev', 'electric vehicle', 'petrol', 'diesel', 'commuting', 'commute'],
    responses: [
      "Replacing petrol car trips with train journeys cuts emissions by roughly 90% per kilometer.",
      "Electric vehicles (EVs) produce up to 70% fewer lifecycle emissions compared to traditional internal combustion engines, depending on how green your power grid is.",
      "A single round-trip flight from New York to London releases about 1.6 tons of CO₂e per passenger—that is equivalent to heating a European home for an entire year!",
      "Active transportation (walking, cycling) is carbon-free, improves cardiovascular health, and reduces local traffic congestion."
    ]
  },
  diet: {
    keywords: ['meat', 'food', 'beef', 'chicken', 'vegan', 'vegetarian', 'pork', 'dairy', 'milk', 'cheese', 'meal', 'eating', 'diet', 'waste', 'organic'],
    responses: [
      "Did you know? Producing beef emits about 20 times more greenhouse gases than producing beans or tofu for the same amount of protein.",
      "Adopting a plant-based (vegan) diet can shrink your personal food-related carbon footprint by up to 60-70%.",
      "Food waste is a major climate driver. If food waste were a country, it would be the third-largest emitter of greenhouse gases globally, right after the US and China.",
      "Opting for locally grown, seasonal foods cuts down on food miles (transport emissions) and supports local farmers."
    ]
  },
  energy: {
    keywords: ['electricity', 'solar', 'wind', 'coal', 'heating', 'gas', 'power', 'appliance', 'ac', 'air conditioning', 'thermostat', 'light', 'led', 'home', 'insulation'],
    responses: [
      "Heating and cooling account for about 50% of the average home's energy consumption. Adjusting your thermostat by just 1°C saves around 5-10% of that energy.",
      "Unplugging 'vampire' electronics (devices left in standby mode) can shave up to 10% off your monthly utility bill.",
      "Switching from incandescent light bulbs to LEDs reduces energy use by 85% and they last up to 25 times longer.",
      "If you own your home, transitioning to solar panels or purchasing green tariffs is a massive leap towards zero-carbon living."
    ]
  },
  shopping: {
    keywords: ['shopping', 'clothes', 'buy', 'clothing', 'fast fashion', 'cotton', 'electronics', 'phone', 'laptop', 'consumer', 'waste', 'landfill', 'recycle'],
    responses: [
      "The fashion industry is responsible for 10% of global carbon emissions. Buying second-hand or keeping your clothes twice as long cuts fashion footprint by 44%.",
      "Manufacturing a new smartphone emits around 80-90 kg CO₂e (most of which happens during mineral mining and factory assembly). Extending your phone's lifespan to 4 years instead of 2 significantly dilutes this impact.",
      "Repairing and upgrading devices instead of throwing them away avoids e-waste and saves resource extraction."
    ]
  },
  general: {
    keywords: ['hello', 'hi', 'hey', 'help', 'what', 'who', 'menu', 'commands'],
    responses: [
      "Hello! I am EcoBuddy, your carbon coach. Ask me about transportation, diet, home energy, or smart shopping. I can also summarize your current footprint progress!",
      "Try asking me things like:\n- 'How am I doing?'\n- 'Tell me about beef carbon emissions.'\n- 'What is the footprint of an EV?'\n- 'Give me a commute tip.'"
    ]
  }
};

/**
 * Parses user input message, matches keywords, and returns an intelligent context-aware response.
 * @param {string} userMessage - The text sent by the user
 * @param {Object} state - The current global application state
 * @returns {string} The assistant response
 */
export function getAssistantResponse(userMessage, state) {
  const query = userMessage.toLowerCase().trim();

  // 1. Context Analysis Requests
  if (query.includes('how am i doing') || query.includes('summary') || query.includes('my footprint') || query.includes('status') || query.includes('progress')) {
    const totalTracked = state.logs
      .filter(l => l.category !== 'challenge')
      .reduce((sum, entry) => sum + entry.co2, 0);

    const savedCo2 = state.totalSavedCo2;
    const logCount = state.logs.length;
    const personaName = PERSONAS[state.selectedPersona]?.title || 'Eco Tracker';

    let statusText = `You are on the **${personaName}** path. \n\n`;
    statusText += `📊 **Your Baseline**: Annualized baseline is **${state.baselineFootprint.total} tons CO₂e**.\n`;
    statusText += `📉 **This Week's Tracked Footprint**: **${totalTracked.toFixed(2)} kg CO₂e** logged across ${logCount} activities.\n`;
    statusText += `🌱 **Carbon Saved**: **${savedCo2.toFixed(1)} kg CO₂e** saved by practicing green challenges!\n`;
    statusText += `⭐️ **XP Rank**: You have earned **${state.xp} XP**.\n\n`;

    if (totalTracked === 0) {
      statusText += "You haven't logged any daily actions yet today. Try adding travel, meals, or electricity usage in the 'Track Activity' tab to see where you stand!";
    } else if (totalTracked > 15) {
      statusText += "Looks like you have logged some high-emission activities. Check out the 'Challenges' tab to find ways to offset them!";
    } else {
      statusText += "Great job keeping your logged carbon low today. Keep tracking and making sustainable swaps!";
    }
    return statusText;
  }

  if (query.includes('tip') || query.includes('suggest') || query.includes('recommendation')) {
    const persona = PERSONAS[state.selectedPersona];
    if (persona && persona.recommendations) {
      const randomTip = persona.recommendations[Math.floor(Math.random() * persona.recommendations.length)];
      return `💡 **Tip for ${persona.title}s**:\n${randomTip}\n\nWant to take action right away? Open the 'Challenges' panel and complete a daily habit.`;
    }
    return "💡 **General Tip**: Turn down your hot water heater thermostat to 48°C (120°F). It saves money and energy!";
  }

  // 2. Keyword Knowledge Base Matching
  let matchedCategory = null;
  let highestMatchCount = 0;

  for (const [category, item] of Object.entries(KNOWLEDGE_BASE)) {
    let matchCount = 0;
    for (const keyword of item.keywords) {
      if (query.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      matchedCategory = category;
    }
  }

  if (matchedCategory && highestMatchCount > 0) {
    const responses = KNOWLEDGE_BASE[matchedCategory].responses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add context check: if user asked about beef and is on Foodie track
    if (matchedCategory === 'diet' && query.includes('beef') && state.selectedPersona === 'foodie') {
      return `🥩 **Red Meat Impact**: ${randomResponse}\n\nSince you are on the **Conscious Foodie** path, you can complete the 'Skip Red Meat' challenge to log a **3.2 kg CO₂e** saving instantly!`;
    }
    
    // If user asked about EV and is on Commuter track
    if (matchedCategory === 'transport' && query.includes('ev') && state.selectedPersona === 'commuter') {
      return `⚡ **EV Insight**: ${randomResponse}\n\nYour commuter persona is optimized to track car miles. Consider updating your profile if you drive or commute via public transit.`;
    }

    return randomResponse;
  }

  // 3. Fallback response with helpful prompt suggestions
  return "I'm not sure I fully understood that sustainability question. \n\nI can help you with:\n" +
         "- **Transportation** (EVs, flights, carpooling)\n" +
         "- **Diet** (reducing beef, vegan meal impacts, food waste)\n" +
         "- **Home Energy** (heating, LED bulbs, vampire loads)\n" +
         "- **Shopping** (fast fashion carbon cost, smartphone mining)\n\n" +
         "Or type **'how am i doing'** to see a full status update of your tracked footprint!";
}
