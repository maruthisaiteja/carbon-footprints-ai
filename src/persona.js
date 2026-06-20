/**
 * Persona Config Module
 * 
 * Defines metadata, onboarding questionnaires, baseline setups, and daily action challenges
 * for each of the three carbon tracking verticals: Commuter, Foodie, and Home.
 */

export const PERSONAS = {
  commuter: {
    id: 'commuter',
    title: 'Urban Commuter',
    icon: '🚗',
    tagline: 'Optimize your transit, reduce travel emissions, and master micro-mobility.',
    description: 'Designed for professionals, students, and city dwellers who spend a significant portion of their footprint on transport. Focuses heavily on switching to EV, taking rail/bus transit, carpooling, and biking.',
    
    // Onboarding baseline questions specific to this persona
    questions: [
      {
        id: 'weeklyKm',
        label: 'How many kilometers do you travel in a typical week?',
        type: 'number',
        default: 150,
        placeholder: 'e.g. 150'
      },
      {
        id: 'vehicleType',
        label: 'What is your primary mode of transportation?',
        type: 'select',
        default: 'petrolCar',
        options: [
          { value: 'petrolCar', label: 'Petrol Car' },
          { value: 'dieselCar', label: 'Diesel Car' },
          { value: 'hybridCar', label: 'Hybrid Car' },
          { value: 'ev', label: 'Electric Vehicle (EV)' },
          { value: 'motorcycle', label: 'Motorcycle' },
          { value: 'bus', label: 'Bus' },
          { value: 'train', label: 'Train / Subway' },
          { value: 'walkCycle', label: 'Walk / Cycle / Active Transit' }
        ]
      },
      {
        id: 'annualFlightsShort',
        label: 'How many short-haul flights (<3 hours) do you take per year?',
        type: 'number',
        default: 2,
        placeholder: 'e.g. 2'
      },
      {
        id: 'annualFlightsLong',
        label: 'How many long-haul flights (>3 hours) do you take per year?',
        type: 'number',
        default: 1,
        placeholder: 'e.g. 1'
      }
    ],

    // Default daily habits / challenges to log
    challenges: [
      {
        id: 'commute_transit',
        title: 'Ride the Rail or Bus',
        description: 'Swapped a car trip for public transit (bus, train, subway).',
        co2Saved: 3.5, // Average kg saved per commute
        xp: 15,
        category: 'transport'
      },
      {
        id: 'commute_active',
        title: 'Active Mobility',
        description: 'Walked, cycled, or used a kick scooter instead of driving.',
        co2Saved: 5.1,
        xp: 25,
        category: 'transport'
      },
      {
        id: 'commute_carpool',
        title: 'Carpooling Passenger',
        description: 'Shared a ride with at least one colleague or friend.',
        co2Saved: 2.5,
        xp: 10,
        category: 'transport'
      },
      {
        id: 'commute_eco_drive',
        title: 'Eco-Driving Habit',
        description: 'Avoided rapid acceleration and maintained optimal speed on highway.',
        co2Saved: 0.8,
        xp: 10,
        category: 'transport'
      }
    ],

    recommendations: [
      'Consider switching to an electric vehicle (EV) or plug-in hybrid if purchasing a new car.',
      'Group multiple small errands into a single circular trip rather than taking separate trips.',
      'Check if your workplace offers tax benefits or subsidies for purchasing commuter rail/bus passes.'
    ]
  },

  foodie: {
    id: 'foodie',
    title: 'Conscious Foodie',
    icon: '🥗',
    tagline: 'Embrace sustainable diets, source locally, and slash kitchen waste.',
    description: 'Designed for food lovers, cooking enthusiasts, and grocery shoppers. Focuses heavily on the high carbon cost of animal proteins, packaging waste, local food supply chains, and food waste reduction.',
    
    questions: [
      {
        id: 'dietStyle',
        label: 'What best describes your current eating habits?',
        type: 'select',
        default: 'lowMeat',
        options: [
          { value: 'vegan', label: 'Strict Vegan (100% plant-based)' },
          { value: 'vegetarian', label: 'Vegetarian (No meat, consumes dairy/eggs)' },
          { value: 'lowMeat', label: 'Flexitarian / Low Meat (Poultry/fish, red meat rarely)' },
          { value: 'highMeat', label: 'Meat-heavy (Regular beef, pork, poultry meals)' }
        ]
      },
      {
        id: 'foodWastePct',
        label: 'Roughly what percentage of bought food gets discarded (spoilage/leftovers)?',
        type: 'select',
        default: '15',
        options: [
          { value: '5', label: 'Minimal (< 5%)' },
          { value: '15', label: 'Average (10% - 20%)' },
          { value: '30', label: 'High (25% - 40%)' }
        ]
      },
      {
        id: 'clothingItemsPerMonth',
        label: 'How many new clothing items do you buy in an average month?',
        type: 'number',
        default: 2,
        placeholder: 'e.g. 2'
      }
    ],

    challenges: [
      {
        id: 'foodie_plant_day',
        title: 'Fully Plant-Based Day',
        description: 'Ate 100% vegan meals today, bypassing dairy, eggs, and meat.',
        co2Saved: 4.8, // kg CO2e savings compared to average diet
        xp: 20,
        category: 'diet'
      },
      {
        id: 'foodie_no_beef',
        title: 'Skip Red Meat',
        description: 'Swapped beef or lamb for poultry, fish, or plant protein.',
        co2Saved: 3.2,
        xp: 12,
        category: 'diet'
      },
      {
        id: 'foodie_zero_waste',
        title: 'Zero Waste Cooking',
        description: 'Used up all leftover ingredients, composted scraps, and threw nothing in landfill.',
        co2Saved: 1.5,
        xp: 15,
        category: 'diet'
      },
      {
        id: 'foodie_local_buy',
        title: 'Locally Sourced Meal',
        description: 'Prepared a meal using ingredients sourced entirely within 100km.',
        co2Saved: 0.7,
        xp: 10,
        category: 'diet'
      }
    ],

    recommendations: [
      'Reducing beef and lamb consumption is the single most effective dietary action you can take to lower your footprint.',
      'Plan your meals weekly and write a list before grocery shopping to keep waste close to zero.',
      'Opt for packaging-free vegetables and fruits at farmers markets to minimize packaging footprint.'
    ]
  },

  home: {
    id: 'home',
    title: 'Smart Home Optimizer',
    icon: '⚡',
    tagline: 'Optimize residential energy, heating, cooling, and smart appliance usage.',
    description: 'Designed for homeowners and renters who want to audit their living space. Focuses on electricity consumption, renewable energy transitions, appliance efficiency ratings, and thermal insulation.',
    
    questions: [
      {
        id: 'monthlyElectricityKwh',
        label: 'What is your average monthly household electricity use (in kWh)?',
        type: 'number',
        default: 300,
        placeholder: 'e.g. 300'
      },
      {
        id: 'electricitySource',
        label: 'What is the primary energy source for your home?',
        type: 'select',
        default: 'gridElectricity',
        options: [
          { value: 'gridElectricity', label: 'Standard Grid Electricity Mix' },
          { value: 'greenElectricity', label: '100% Green / Solar / Renewable Plan' },
          { value: 'naturalGas', label: 'Natural Gas Heating & Electricity' },
          { value: 'heatingOil', label: 'Heating Oil' },
          { value: 'coalHeating', label: 'Coal / Traditional Solid Fuels' }
        ]
      },
      {
        id: 'homeSizeSqFt',
        label: 'What is the approximate size of your living space (in sq ft)?',
        type: 'number',
        default: 1000,
        placeholder: 'e.g. 1000'
      }
    ],

    challenges: [
      {
        id: 'home_cold_wash',
        title: 'Cold Water Laundry',
        description: 'Washed laundry at 30°C (or tap cold) instead of 40/60°C.',
        co2Saved: 0.6,
        xp: 10,
        category: 'energy'
      },
      {
        id: 'home_standby_kill',
        title: 'Vampire Draw Slayer',
        description: 'Switched off smart plugs or unplugged standby electronics overnight.',
        co2Saved: 0.4,
        xp: 10,
        category: 'energy'
      },
      {
        id: 'home_temp_dial',
        title: 'Thermostat Adjustment',
        description: 'Lowered heating thermostat by 1°C or raised AC thermostat by 1°C.',
        co2Saved: 1.2,
        xp: 15,
        category: 'energy'
      },
      {
        id: 'home_line_dry',
        title: 'Natural Line Drying',
        description: 'Dried clothes on a drying rack/line instead of using the electric dryer.',
        co2Saved: 1.8,
        xp: 15,
        category: 'energy'
      }
    ],

    recommendations: [
      'Replace old incandescent bulbs with high-efficiency LEDs; they use up to 85% less energy.',
      'Check seals on windows and exterior doors to prevent heat loss, which accounts for 20% of heating bills.',
      'Wash laundry on short eco-cycles using cold water to reduce energy demand.'
    ]
  }
};
