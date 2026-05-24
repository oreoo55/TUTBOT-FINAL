import type { QuickAction } from '../lib/types';

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'top_sights_cairo',
    label: 'Top Cairo sights',
    prompt: "Show me the top sights to visit in Cairo with a short note for each",
  },
  {
    key: '3_day_itinerary',
    label: '3-day itinerary',
    prompt: "Suggest a 3-day itinerary in Egypt focused on history and archeology",
  },
  {
    key: 'budget_low',
    label: 'Budget options',
    prompt: "Recommend budget-friendly places and activities in Egypt for a traveler on a tight budget",
  },
  {
    key: 'luxury_trip',
    label: 'Luxury ideas',
    prompt: "Suggest luxury travel ideas and high-end experiences in Egypt",
  },
  {
    key: 'beach_getaway',
    label: 'Beach getaways',
    prompt: "Recommend beach destinations in Egypt and what to do there",
  },
  {
    key: 'family_friendly',
    label: 'Family friendly',
    prompt: "What are family-friendly attractions and tips for visiting Egypt with children?",
  },
];

export default QUICK_ACTIONS;
