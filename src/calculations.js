/**
 * Carbon Footprint Calculations Module
 * 
 * Provides official emission factors and conversion formulas to compute carbon emissions
 * in kilograms of CO2 equivalent (kg CO2e) for different activities.
 * 
 * Sources/Methodology:
 * - EPA (U.S. Environmental Protection Agency) Emission Factors Hub
 * - UK DEFRA (Department for Environment, Food & Rural Affairs) GHG Conversion Factors
 * - IPCC (Intergovernmental Panel on Climate Change) Reports
 */

// --- EMISSION FACTORS (kg CO2e per unit) ---

export const EMISSION_FACTORS = {
  // Transportation: kg CO2e per km per passenger
  transport: {
    petrolCar: 0.170,     // Average petrol passenger car
    dieselCar: 0.171,     // Average diesel passenger car
    hybridCar: 0.110,     // Hybrid passenger car
    ev: 0.050,            // Electric vehicle (including average grid electricity generation)
    motorcycle: 0.114,    // Average motorcycle
    bus: 0.035,           // Local bus transit per passenger-km
    train: 0.015,         // Rail transit per passenger-km
    flightShort: 0.150,   // Short-haul flight (< 3 hours) per passenger-km
    flightLong: 0.195,    // Long-haul flight (> 3 hours) per passenger-km
    walkCycle: 0.000      // Walking, biking, running (zero carbon emissions)
  },

  // Diet: kg CO2e per meal
  diet: {
    vegan: 0.50,          // Vegan meal (plant-based, local/low-impact)
    vegetarian: 0.85,     // Vegetarian (dairy, eggs, no meat)
    fish: 1.45,           // Seafood/fish meal
    poultry: 1.80,        // Poultry (chicken, turkey) meal
    pork: 2.40,           // Pork/pig meat meal
    beefLamb: 6.20        // Red meat (beef, lamb) meal - very high impact
  },

  // Home Energy: kg CO2e per kWh
  energy: {
    gridElectricity: 0.380, // Average national grid electricity mix
    greenElectricity: 0.015, // Wind, solar, hydro (lifecycle emissions)
    naturalGas: 0.185,       // Natural gas heating/cooking per kWh equivalent
    heatingOil: 0.268,       // Heating oil per kWh equivalent
    coalHeating: 0.340        // Coal heating per kWh equivalent
  },

  // Shopping & Lifestyle: kg CO2e per item/purchase
  shopping: {
    clothing: 12.5,        // Average new apparel item (cotton/synthetic mix)
    electronics: 85.0,     // Smartphone, tablet, or medium device
    furniture: 45.0,       // Flatpack or minor furniture
    miscSmall: 1.50,       // Small plastic/household goods
    packagedFood: 0.75     // Processed/heavily packaged snack/grocery item
  }
};

/**
 * Calculates carbon footprint for a transport activity.
 * @param {string} type - Vehicle type (from EMISSION_FACTORS.transport keys)
 * @param {number} distanceKm - Distance traveled in kilometers
 * @returns {number} Carbon footprint in kg CO2e
 */
export function calculateTransportEmissions(type, distanceKm) {
  if (distanceKm < 0) return 0;
  const factor = EMISSION_FACTORS.transport[type] ?? EMISSION_FACTORS.transport.petrolCar;
  return Number((distanceKm * factor).toFixed(3));
}

/**
 * Calculates carbon footprint for a diet activity.
 * @param {string} type - Meal type (from EMISSION_FACTORS.diet keys)
 * @param {number} mealCount - Number of meals
 * @returns {number} Carbon footprint in kg CO2e
 */
export function calculateDietEmissions(type, mealCount) {
  if (mealCount < 0) return 0;
  const factor = EMISSION_FACTORS.diet[type] ?? EMISSION_FACTORS.diet.vegetarian;
  return Number((mealCount * factor).toFixed(3));
}

/**
 * Calculates carbon footprint for household energy consumption.
 * @param {string} type - Energy source (from EMISSION_FACTORS.energy keys)
 * @param {number} kwhValue - Consumption in kilowatt-hours (kWh)
 * @returns {number} Carbon footprint in kg CO2e
 */
export function calculateEnergyEmissions(type, kwhValue) {
  if (kwhValue < 0) return 0;
  const factor = EMISSION_FACTORS.energy[type] ?? EMISSION_FACTORS.energy.gridElectricity;
  return Number((kwhValue * factor).toFixed(3));
}

/**
 * Calculates carbon footprint for shopping items.
 * @param {string} type - Item type (from EMISSION_FACTORS.shopping keys)
 * @param {number} itemCount - Number of items purchased
 * @returns {number} Carbon footprint in kg CO2e
 */
export function calculateShoppingEmissions(type, itemCount) {
  if (itemCount < 0) return 0;
  const factor = EMISSION_FACTORS.shopping[type] ?? EMISSION_FACTORS.shopping.miscSmall;
  return Number((itemCount * factor).toFixed(3));
}

/**
 * Computes baseline carbon footprint estimation based on onboarding questionnaires.
 * Used to set user context before daily tracking begins.
 * Returns annual emissions in metric tons of CO2e.
 * 
 * @param {Object} baselineData - Questionnaire answers
 * @param {string} vertical - User's chosen vertical ('commuter', 'foodie', 'home')
 * @returns {Object} Estimated annual footprint split by categories (in metric tons CO2e)
 */
export function estimateBaselineAnnualFootprint(baselineData, vertical) {
  const defaults = {
    weeklyKm: 150,
    vehicleType: 'petrolCar',
    dietStyle: 'vegetarian',
    monthlyElectricityKwh: 300,
    electricitySource: 'gridElectricity',
    annualFlightsShort: 2,
    annualFlightsLong: 1,
    clothingItemsPerMonth: 3,
    electronicsPerYear: 1
  };

  const data = { ...defaults, ...baselineData };

  // 1. Transportation
  const weeklyTransportEmissions = calculateTransportEmissions(data.vehicleType, data.weeklyKm);
  const annualFlightEmissions = 
    (data.annualFlightsShort * 600 * EMISSION_FACTORS.transport.flightShort) + // assumes 600km avg short flight
    (data.annualFlightsLong * 4000 * EMISSION_FACTORS.transport.flightLong);  // assumes 4000km avg long flight
  const annualTransportTons = ((weeklyTransportEmissions * 52) + annualFlightEmissions) / 1000;

  // 2. Food / Diet
  let dietMeals = { vegan: 0, vegetarian: 0, poultry: 0, fish: 0, pork: 0, beefLamb: 0 };
  const totalMealsPerWeek = 21; // 3 meals a day * 7 days

  if (data.dietStyle === 'vegan') {
    dietMeals.vegan = totalMealsPerWeek;
  } else if (data.dietStyle === 'vegetarian') {
    dietMeals.vegetarian = totalMealsPerWeek;
  } else if (data.dietStyle === 'lowMeat') {
    dietMeals.vegetarian = 10;
    dietMeals.vegan = 5;
    dietMeals.poultry = 4;
    dietMeals.fish = 2;
  } else { // highMeat
    dietMeals.beefLamb = 5;
    dietMeals.pork = 4;
    dietMeals.poultry = 7;
    dietMeals.fish = 2;
    dietMeals.vegetarian = 3;
  }

  let weeklyDietEmissions = 0;
  for (const [mealType, count] of Object.entries(dietMeals)) {
    weeklyDietEmissions += calculateDietEmissions(mealType, count);
  }
  const annualDietTons = (weeklyDietEmissions * 52) / 1000;

  // 3. Home Energy
  const monthlyEnergyEmissions = calculateEnergyEmissions(data.electricitySource, data.monthlyElectricityKwh);
  const annualEnergyTons = (monthlyEnergyEmissions * 12) / 1000;

  // 4. Shopping / Consumption
  const monthlyShoppingEmissions = calculateShoppingEmissions('clothing', data.clothingItemsPerMonth);
  const annualShoppingEmissions = 
    (monthlyShoppingEmissions * 12) + 
    calculateShoppingEmissions('electronics', data.electronicsPerYear);
  const annualShoppingTons = annualShoppingEmissions / 1000;

  const totalTons = annualTransportTons + annualDietTons + annualEnergyTons + annualShoppingTons;

  return {
    transport: Number(annualTransportTons.toFixed(2)),
    diet: Number(annualDietTons.toFixed(2)),
    energy: Number(annualEnergyTons.toFixed(2)),
    shopping: Number(annualShoppingTons.toFixed(2)),
    total: Number(totalTons.toFixed(2))
  };
}
