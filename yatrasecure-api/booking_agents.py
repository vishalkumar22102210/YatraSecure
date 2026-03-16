"""
YatraSecure AI Travel Booking Engine
Multi-Agent CrewAI Architecture with 8 Specialized Agents
"""
import os
import sys
import json
import logging

logging.basicConfig(level=logging.ERROR, stream=sys.stderr)

# ══════════════════════════════════════════════════════════════════════════════
# ENV SETUP
# ══════════════════════════════════════════════════════════════════════════════
api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY")

if not api_key or api_key == "PASTE_YOUR_GROQ_API_KEY_HERE":
    # Demo mode fallback
    try:
        input_data = sys.argv[1] if len(sys.argv) > 1 else "{}"
        params = json.loads(input_data)
        dest = params.get("destination", "Goa")
    except:
        dest = "Goa"
    
    print(json.dumps({
        "success": True,
        "structured": True,
        "destination": dest,
        "package": f"# 🌴 AI Travel Package: {dest}\n(Demo Mode — Configure GROQ_API_KEY for live AI scouting)",
        "hotels": [
            {"name": f"Premium Stay {dest}", "price": 4500, "rating": 4.6, "location": dest, "description": "Well-rated hotel with modern amenities", "bookingPlatform": "MakeMyTrip", "bookingUrl": "https://www.makemytrip.com/", "trustScore": 88, "category": "hotel"},
            {"name": f"Budget Hostel {dest}", "price": 1200, "rating": 4.3, "location": dest, "description": "Clean, social hostel perfect for backpackers", "bookingPlatform": "Hostelworld", "bookingUrl": "https://www.hostelworld.com/", "trustScore": 82, "category": "hostel"},
        ],
        "activities": [
            {"name": "City Heritage Walk", "price": 800, "rating": 4.8, "location": dest, "description": "Guided tour of historic landmarks", "bookingPlatform": "GetYourGuide", "bookingUrl": "https://www.getyourguide.com/", "trustScore": 91, "category": "culture"},
            {"name": "Local Food Tour", "price": 1500, "rating": 4.7, "location": dest, "description": "Taste authentic street food with a local guide", "bookingPlatform": "Viator", "bookingUrl": "https://www.viator.com/", "trustScore": 89, "category": "food"},
        ],
        "restaurants": [
            {"name": f"Cafe {dest}", "price": 600, "rating": 4.5, "location": dest, "description": "Popular cafe with great ambiance", "source": "Google Maps", "trustScore": 85, "category": "cafe"},
        ],
        "hiddenGems": [
            {"name": "Secret Viewpoint", "description": "A quiet hilltop with panoramic views, rarely visited by tourists", "vibe": "Quiet", "bestTime": "Sunrise", "tip": "Bring a warm jacket in winter"},
        ],
        "transport": [
            {"mode": "Flight", "provider": "IndiGo", "estimatedPrice": 4500, "platform": "Skyscanner", "bookingUrl": "https://www.skyscanner.co.in/"},
            {"mode": "Train", "provider": "IRCTC", "estimatedPrice": 1200, "platform": "IRCTC", "bookingUrl": "https://www.irctc.co.in/"},
        ],
        "budgetBreakdown": {
            "accommodation": 45, "activities": 25, "food": 15, "transport": 15
        },
        "totalEstimated": 15000,
        "savingsTips": ["Book 2 weeks in advance for best flight prices", "Choose hostels for budget-friendly stays"]
    }))
    sys.exit(0)

# Configure for Groq via OpenAI-compatible API
if api_key.startswith("gsk_"):
    os.environ["OPENAI_API_KEY"] = api_key
    os.environ["OPENAI_API_BASE"] = "https://api.groq.com/openai/v1"
    os.environ["OPENAI_MODEL_NAME"] = "llama-3.3-70b-versatile"
else:
    os.environ["OPENAI_API_KEY"] = api_key

# ══════════════════════════════════════════════════════════════════════════════
# IMPORT CREWAI (after env setup)
# ══════════════════════════════════════════════════════════════════════════════
from crewai import Agent, Task, Crew, Process

def main():
    try:
        input_data = sys.argv[1] if len(sys.argv) > 1 else "{}"
        params = json.loads(input_data)
        
        destination = params.get("destination", "a beautiful location")
        dates = params.get("dates", "flexible dates")
        budget = str(params.get("budget", "50000"))
        custom_prompt = params.get("customPrompt", "")
        answers = params.get("answers", {})
        travelers = params.get("travelers", 1)
        
        # New Customization parameters
        acc_pref = answers.get("accommodation", "Any")
        food_pref = answers.get("food", "Any")
        trip_style = answers.get("style", "Any")
        gems_toggle = answers.get("gemsToggle", "Both")
        
        trip_context = f"""
TRIP DETAILS & CONSTRAINTS:
- Destination: {destination}
- Travel Dates: {dates}
- Total Budget: ₹{budget}
- Number of Travelers: {travelers}
- Accommodation Preference: {acc_pref} (MUST strictly follow this style if not 'Any')
- Food Preference: {food_pref} (MUST focus on this dining style if not 'Any')
- Trip Style/Theme: {trip_style} (Tailor activities and vibe to this theme)
- Hidden Gems Preference: {gems_toggle}
- User Conversational Edits & Edits History: {custom_prompt or 'No specific edits'}
- Additional Flight/Date Info: {answers.get('flightPref', 'Any')}, Flexible Dates: {answers.get('flexDates', 'No')}
"""

        # ══════════════════════════════════════════════════════════════════
        # AGENT 1: Travel Research Agent
        # ══════════════════════════════════════════════════════════════════
        research_agent = Agent(
            role='Senior Travel Research Analyst',
            goal=f'Research travel options for {destination} focusing strictly on {acc_pref} stays, {food_pref} food, and a {trip_style} vibe.',
            backstory="""You are an elite travel intelligence analyst with deep knowledge of global and Indian travel platforms.
You know pricing patterns on Booking.com, Agoda, Airbnb, Hostelworld, MakeMyTrip, Goibibo, Cleartrip, and Yatra.
For flights you reference Skyscanner, Google Flights, Kayak, and Momondo.
For trains in India you reference IRCTC and RailYatri.
For activities you know GetYourGuide, Viator, Klook.
You aggressively filter results to match the USER'S SPECIFIC PREFERENCES (e.g., if they ask for Luxury, only show 5-star).""",
            verbose=False,
            allow_delegation=False
        )

        # ══════════════════════════════════════════════════════════════════
        # AGENT 2: Review Intelligence Agent
        # ══════════════════════════════════════════════════════════════════
        review_agent = Agent(
            role='Travel Review & Trust Analyst',
            goal='Analyze traveler reviews and determine trust scores for each recommended option',
            backstory="""You are an expert in analyzing traveler sentiment from TripAdvisor, Google Reviews, Reddit travel communities, and social media.
You evaluate each option on: quality of experience, safety, cleanliness, value for money, and crowd sentiment.
You assign a trust score from 0-100 based on aggregate review analysis.
A score above 85 means 'Highly Trusted', 70-85 is 'Trusted', below 70 is 'Mixed Reviews'.""",
            verbose=False,
            allow_delegation=False
        )

        # ══════════════════════════════════════════════════════════════════
        # AGENT 3: Budget Optimization Agent
        # ══════════════════════════════════════════════════════════════════
        budget_agent = Agent(
            role='Smart Budget Optimizer',
            goal=f'Force the total trip cost to align intelligently with the total budget of ₹{budget}',
            backstory="""You are a financial travel advisor who specializes in optimizing trip budgets.
You distribute budgets based on user preferences (e.g., luxury travelers spend more on hotels, adventure on activities).
If the requested budget is impossible for the destination/style, you still provide the closest realistic distribution and MUST add specific money-saving tips for this exact scenario.""",
            verbose=False,
            allow_delegation=False
        )

        # ══════════════════════════════════════════════════════════════════
        # AGENT 4: Hidden Gems Discovery Agent
        # ══════════════════════════════════════════════════════════════════
        gems_agent = Agent(
            role='Hidden Gems Scout',
            goal=f'Discover spots near {destination} matching the preference: {gems_toggle}',
            backstory="""You specialize in balancing mainstream tourist attractions with off-the-beaten-path experiences.
If the user wants 'Tourist Attractions', point out the major must-sees.
If they want 'Hidden Gems', find places most tourists miss.
If 'Both', provide a mix.""",
            verbose=False,
            allow_delegation=False
        )

        # ══════════════════════════════════════════════════════════════════
        # AGENT 5: Package Builder Agent
        # ══════════════════════════════════════════════════════════════════
        package_agent = Agent(
            role='AI Travel Package Architect',
            goal='Compile all research into a structured JSON travel package',
            backstory="""You are the final architect who receives analyzed data from all other agents and compiles it into a clean, structured travel package.
You MUST output ONLY a valid JSON object — no markdown, no explanation, no extra text.
The JSON must follow the exact schema specified in your task.
You are meticulous about data integrity and never include placeholder or empty fields.""",
            verbose=False,
            allow_delegation=False
        )

        # ══════════════════════════════════════════════════════════════════
        # TASKS
        # ══════════════════════════════════════════════════════════════════

        research_task = Task(
            description=f"""{trip_context}
            
TASK: Research travel options for {destination}.
Find:
1. Top 3-4 ACCOMMODATION options (mix of hotels, hostels, Airbnb) with realistic INR prices, ratings, and platform names
2. Top 3-4 ACTIVITIES/EXPERIENCES with prices, ratings, and booking platforms
3. Top 2-3 RESTAURANTS/CAFES worth visiting
4. TRANSPORT options (flights, trains, buses) with estimated prices and platform names

For each item provide: name, estimated price in INR, rating (out of 5), specific location, short description, and which platform to book on.
Be realistic with prices for the Indian market. Include actual booking platform URLs where possible.""",
            expected_output='Detailed list of accommodation, activities, restaurants, and transport options with prices, ratings, and platform names.',
            agent=research_agent
        )

        review_task = Task(
            description=f"""Based on the research results for {destination}, analyze the trustworthiness of each recommended option.

For each hotel, activity, and restaurant mentioned:
1. Assess likely review sentiment (positive/mixed/negative)
2. Assign a TRUST SCORE from 0 to 100
3. Note any safety concerns
4. Identify which ones are "Tourist Trap" vs "Genuine Experience"

Focus on quality indicators: cleanliness, safety, value, authenticity, and crowd feedback.""",
            expected_output='Trust analysis with scores for each recommendation.',
            agent=review_agent,
            context=[research_task]
        )

        budget_task = Task(
            description=f"""{trip_context}

Based on the researched options and their prices, create an optimal budget distribution.
1. Calculate how much to allocate for: Accommodation, Activities, Food, Transport
2. Check if the total budget of ₹{budget} is sufficient
3. Suggest 3-4 specific money-saving tips for {destination}
4. If budget is tight, suggest cheaper alternatives""",
            expected_output='Budget breakdown with percentages, absolute amounts, and saving tips.',
            agent=budget_agent,
            context=[research_task]
        )

        gems_task = Task(
            description=f"""Find 3-4 places/experiences near {destination} matching the preference: {gems_toggle}
            
If the user's conversational edits mention specific things to add or remove, YOU MUST obey them.

For each place provide:
- Name of the place/experience
- Why it's special (2 sentences)
- Vibe: Quiet/Vibrant/Rustic/Artistic
- Best time to visit
- A specific insider tip""",
            expected_output='List of 3-4 spots with descriptions, vibes, and tips.',
            agent=gems_agent
        )

        package_task = Task(
            description=f"""Compile ALL the research, reviews, budget analysis, and hidden gems into a SINGLE structured JSON object.

You MUST return ONLY valid JSON with this EXACT structure (no markdown, no explanation, no extra text):
{{
  "destination": "{destination}",
  "hotels": [
    {{"name": "...", "price": 0, "rating": 4.5, "location": "...", "description": "...", "bookingPlatform": "...", "bookingUrl": "https://...", "trustScore": 85, "category": "hotel/hostel/resort"}}
  ],
  "activities": [
    {{"name": "...", "price": 0, "rating": 4.5, "location": "...", "description": "...", "bookingPlatform": "...", "bookingUrl": "https://...", "trustScore": 85, "category": "adventure/culture/food/wellness"}}
  ],
  "restaurants": [
    {{"name": "...", "price": 0, "rating": 4.5, "location": "...", "description": "...", "source": "Google Maps/TripAdvisor", "trustScore": 85, "category": "cafe/restaurant/street-food"}}
  ],
  "hiddenGems": [
    {{"name": "...", "description": "...", "vibe": "Quiet/Vibrant", "bestTime": "...", "tip": "..."}}
  ],
  "transport": [
    {{"mode": "Flight/Train/Bus", "provider": "...", "estimatedPrice": 0, "platform": "...", "bookingUrl": "https://..."}}
  ],
  "budgetBreakdown": {{
    "accommodation": 40,
    "activities": 25,
    "food": 20,
    "transport": 15
  }},
  "totalEstimated": 0,
  "savingsTips": ["tip1", "tip2", "tip3"]
}}

CRITICAL: Output ONLY the JSON object. No other text, no markdown wrappers.""",
            expected_output='A single valid JSON object with the complete travel package.',
            agent=package_agent,
            context=[research_task, review_task, budget_task, gems_task]
        )

        # ══════════════════════════════════════════════════════════════════
        # CREW EXECUTION
        # ══════════════════════════════════════════════════════════════════
        crew = Crew(
            agents=[research_agent, review_agent, budget_agent, gems_agent, package_agent],
            tasks=[research_task, review_task, budget_task, gems_task, package_task],
            verbose=False,
            process=Process.sequential
        )
        
        result = crew.kickoff()
        raw_output = str(result)
        
        # Try to extract JSON from the output
        parsed = None
        
        # Method 1: Direct parse
        try:
            parsed = json.loads(raw_output)
        except:
            pass
        
        # Method 2: Find JSON block in output
        if not parsed:
            import re
            json_match = re.search(r'\{[\s\S]*\}', raw_output)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                except:
                    pass
        
        if parsed:
            parsed["success"] = True
            parsed["structured"] = True
            # Generate a markdown summary too
            parsed["package"] = generate_markdown_summary(parsed, destination, budget)
            print(json.dumps(parsed))
        else:
            # Fallback: return raw as markdown package
            print(json.dumps({
                "success": True,
                "structured": False,
                "package": raw_output,
                "destination": destination
            }))
        
    except Exception as e:
        logging.error(f"Booking engine error: {e}")
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)


def generate_markdown_summary(data, destination, budget):
    """Generate a beautiful markdown summary from structured data."""
    md = f"# 🌍 AI Travel Package: {destination}\n\n"
    
    # Hotels
    hotels = data.get("hotels", [])
    if hotels:
        md += "### 🏨 Top Stays\n"
        for h in hotels[:4]:
            score_badge = "✅ Highly Trusted" if h.get("trustScore", 0) >= 85 else "🟡 Trusted" if h.get("trustScore", 0) >= 70 else "⚠️ Mixed"
            md += f"- **{h['name']}** — ₹{h.get('price', 'N/A')} • ⭐ {h.get('rating', 'N/A')} • {score_badge}\n"
            md += f"  Book on [{h.get('bookingPlatform', 'Online')}]({h.get('bookingUrl', '#')})\n"
        md += "\n"
    
    # Activities
    activities = data.get("activities", [])
    if activities:
        md += "### 🎯 Top Experiences\n"
        for a in activities[:4]:
            md += f"- **{a['name']}** — ₹{a.get('price', 'N/A')} • ⭐ {a.get('rating', 'N/A')}\n"
            md += f"  Book on [{a.get('bookingPlatform', 'Online')}]({a.get('bookingUrl', '#')})\n"
        md += "\n"
    
    # Restaurants
    restaurants = data.get("restaurants", [])
    if restaurants:
        md += "### 🍽️ Where to Eat\n"
        for r in restaurants[:3]:
            md += f"- **{r['name']}** — ₹{r.get('price', 'N/A')} avg • ⭐ {r.get('rating', 'N/A')}\n"
        md += "\n"
    
    # Hidden Gems
    gems = data.get("hiddenGems", [])
    if gems:
        md += "### 💎 Hidden Gems\n"
        for g in gems[:3]:
            md += f"- **{g['name']}** — {g.get('description', '')}\n"
            md += f"  🕐 Best time: {g.get('bestTime', 'Anytime')} | 💡 {g.get('tip', '')}\n"
        md += "\n"
    
    # Transport
    transport = data.get("transport", [])
    if transport:
        md += "### ✈️ Getting There\n"
        for t in transport[:3]:
            md += f"- **{t.get('mode', 'Transport')}** via {t.get('provider', 'Various')} — ₹{t.get('estimatedPrice', 'N/A')}\n"
        md += "\n"
    
    # Budget
    breakdown = data.get("budgetBreakdown", {})
    if breakdown:
        md += f"### 💰 Budget Breakdown (₹{budget} total)\n"
        for cat, pct in breakdown.items():
            md += f"- {cat.title()}: {pct}%\n"
        md += "\n"
    
    tips = data.get("savingsTips", [])
    if tips:
        md += "### 💡 Money-Saving Tips\n"
        for t in tips[:3]:
            md += f"- {t}\n"
    
    return md


if __name__ == "__main__":
    main()
