import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AssistantService {
  constructor(private configService: ConfigService) {}

  async chatWithAssistant(
    tripData: any, // Basic trip details for context
    messages: ChatMessage[],
  ): Promise<string> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      return "I'm your AI Travel Companion (Demo Mode)! 👋 Once your GROQ_API_KEY is configured in the backend, I'll be able to help you plan every detail of your trip. For now, I'm here to greet you!";
    }

    // System prompt giving the assistant context about the trip
    const systemPromptMessage: ChatMessage = {
      role: 'system',
      content: `You are a highly helpful and enthusiastic AI Travel Companion for the travelers of a trip named "${tripData.name}".
The trip is from ${tripData.fromCity} to ${tripData.toCity}.
Dates: ${new Date(tripData.startDate).toDateString()} to ${new Date(tripData.endDate).toDateString()}.
Budget: ₹${tripData.budget}.
You must assist them with any questions they have: recommending cafes, planning tomorrow's itinerary, weather updates, packing lists, etc.
Be concise, friendly, and format your responses clearly in markdown (without returning an entire JSON or markdown block wrapper, just plain conversational markdown text).`
    };

    const payloadMessages = [
      systemPromptMessage,
      ...messages
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages:    payloadMessages,
        max_tokens:  800,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to communicate with the Groq AI');
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  async predictBudget(tripData: any, memberCount: number): Promise<any> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
        return {
            totalEstimated: tripData.budget || 50000,
            breakdown: [
              { category: "Transport", amount: (tripData.budget || 50000) * 0.4, reason: "Estimated based on distance" },
              { category: "Accommodation", amount: (tripData.budget || 50000) * 0.3, reason: "Average hotel pricing" },
              { category: "Misc", amount: (tripData.budget || 50000) * 0.3, reason: "Food and local travel" }
            ],
            advice: "Budget lookin' good! Set up your GROQ_API_KEY for a hyper-accurate AI breakdown."
          };
    }

    const days = Math.ceil(
      (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

    const prompt = `Act as an expert travel budget estimator. Provide a realistic budget estimate for a group trip from ${tripData.fromCity} to ${tripData.toCity} lasting ${days} days for ${memberCount} members.
The trip type is "${tripData.tripType}" and the total planned budget is ₹${tripData.budget}.

Return ONLY a valid JSON object with no markdown wrappers or other text.
Use this structure:
{
  "totalEstimated": 0,
  "breakdown": [
    { "category": "Transport", "amount": 0, "reason": "..." },
    { "category": "Accommodation", "amount": 0, "reason": "..." },
    { "category": "Food", "amount": 0, "reason": "..." },
    { "category": "Activities", "amount": 0, "reason": "..." },
    { "category": "Misc", "amount": 0, "reason": "..." }
  ],
  "advice": "A short 1-2 sentence tip based on the budget vs estimated cost."
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens:  800,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to get budget prediction');
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    const jsonStr   = jsonMatch ? jsonMatch[0] : raw;

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI returned invalid format.');
    }
  }

  async discoverHiddenGems(tripData: any, userQuery?: string): Promise<any> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
        return {
            recommendations: [
              {
                id: "demo-gem",
                name: "Local Secret Spot",
                shortDescription: "A beautiful hidden location that travelers love.",
                distance: "Nearby",
                bestTime: "Sunrise/Sunset",
                activities: ["Photography", "Relaxing"],
                tips: "Bring your camera!"
              }
            ]
          };
    }

    const prompt = `Act as an expert local travel guide for ${tripData.toCity}, India.
The user is traveling from ${tripData.fromCity} to ${tripData.toCity}.
They are looking for "hidden gems", underrated places, or unique experiences near their destination.
User's specific request (if any): ${userQuery || "Suggest less crowded, beautiful, or unique places nearby."}

Return ONLY a valid JSON object with no markdown wrappers or other text.
Use this structure:
{
  "recommendations": [
    {
      "id": "gem-1",
      "name": "Location Name",
      "shortDescription": "1-2 sentence description",
      "distance": "Distance from main destination (e.g. '15 km from Manali')",
      "bestTime": "Best time to visit",
      "activities": ["activity1", "activity2"],
      "tips": "Quick tip"
    }
  ]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens:  1000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to discover hidden gems');
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    const jsonStr   = jsonMatch ? jsonMatch[0] : raw;

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI returned invalid format.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AUTONOMOUS TRAVEL MARKETPLACE (PHASE 19)
  // ══════════════════════════════════════════════════════════════════════════════
  async getMarketplaceRecommendations(tripData: any): Promise<any> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
        return { categories: [] };
    }

    const prompt = `Act as an expert travel agent and marketplace engine for a group trip from ${tripData.fromCity} to ${tripData.toCity}, India.
Trip Type: ${tripData.tripType}
Budget: ₹${tripData.budget}

Return ONLY a valid JSON object with detailed travel marketplace recommendations tailored to this trip.
Prioritize popular and highly-rated options. Always define the price in INR.
Provide at least 3-4 options per category.

Format strictly as:
{
  "categories": [
    {
      "title": "Adventure Activities",
      "items": [
        { "id": "act-1", "name": "Paragliding", "description": "Short desc", "price": 2500, "rating": 4.8, "location": "Solang Valley" }
      ]
    },
    {
      "title": "Local Guides",
      "items": [
        { "id": "guide-1", "name": "Ravi Tour Guide", "description": "Full day tour", "price": 1000, "rating": 4.9, "location": "City Center" }
      ]
    },
    {
      "title": "Budget Stays & Hostels",
      "items": []
    },
    {
      "title": "Food & Cafes",
      "items": []
    }
  ]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens:  2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch marketplace options');
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    const jsonStr   = jsonMatch ? jsonMatch[0] : raw;

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI returned invalid format.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DESTINATION GUIDES (PHASE 16)
  // ══════════════════════════════════════════════════════════════════════════════
  async getDestinationGuide(destination: string): Promise<any> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
        return {
            destination,
            overview: `A beautiful destination known for its rich culture and landscapes.`,
            bestTime: "October to March",
            budgetLevel: "Medium",
            topPlaces: [],
            itinerary3Days: [],
            localFood: [],
            travelTips: ["Explore more with YatraSecure AI!"]
          };
    }

    const prompt = `Act as a world-class travel expert. Provide a comprehensive destination guide for ${destination}.

Return ONLY a valid JSON object with the following structure:
{
  "destination": "${destination}",
  "overview": "2-3 sentences beautiful description",
  "bestTime": "Best months to visit and why",
  "budgetLevel": "Low/Medium/High",
  "topPlaces": [
    { "name": "Place Name", "description": "Short desc", "type": "Nature/Culture/Adventure" }
  ],
  "itinerary3Days": [
    { "day": 1, "title": "Day 1 Theme", "activities": ["Activity 1", "Activity 2"] },
    { "day": 2, "title": "Day 2 Theme", "activities": [] },
    { "day": 3, "title": "Day 3 Theme", "activities": [] }
  ],
  "localFood": ["Dish 1", "Dish 2"],
  "travelTips": ["Tip 1", "Tip 2"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens:  2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch destination guide');
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const jsonMatch = raw?.match(/\{[\s\S]*\}/);
    const jsonStr   = jsonMatch ? jsonMatch[0] : raw;

    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('AI returned invalid format.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AI PACKING SUGGESTIONS (PHASE 13)
  // ══════════════════════════════════════════════════════════════════════════════
  async suggestChecklistItems(tripData: any): Promise<string[]> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
        return ["Comfortable Shoes", "Camera", "Sunscreen", "Water Bottle", "Power Bank"];
    }

    const days = Math.ceil(
      (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

    const prompt = `Act as an expert travel organizer. Provide a list of essential packing items for a trip from ${tripData.fromCity} to ${tripData.toCity} for ${days} days.
The trip type is "${tripData.tripType}".
Return ONLY a valid JSON object with a single key "items" containing a simple array of strings (max 15 items).
Use this structure:
{
  "items": ["Item 1", "Item 2", "Item 3"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens:  500,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to get packing suggestions');
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    try {
      const parsed = JSON.parse(raw);
      return parsed.items || [];
    } catch {
      return [];
    }
  }
}
