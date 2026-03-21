import { Injectable, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private groq: Groq;

  constructor(private readonly prisma: PrismaService, private configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY') || 'dummy_key_for_build',
    });
  }

  // ─── DB Cache helpers ─────────────────────────────────────────────
  private destKey(destination: string) {
    return destination.toLowerCase().trim();
  }

  private async getDbCache(destination: string) {
    return this.prisma.aiDestinationCache.findUnique({
      where: { destination: this.destKey(destination) },
    });
  }

  private async upsertDbCache(destination: string, field: 'overview' | 'highlights', data: any) {
    const key = this.destKey(destination);
    await this.prisma.aiDestinationCache.upsert({
      where: { destination: key },
      create: { destination: key, [field]: data },
      update: { [field]: data },
    });
  }

  // ─── Groq model helper ──────────────────────────────────────────
  private async generateContent(prompt: string) {
    const completion = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || '{}';
  }

  private async getTripDetails(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    const isMember = trip.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return trip;
  }

  // ─── Itinerary ────────────────────────────────────────────────────
  async generateItinerary(tripId: string, userId: string, customPrompt?: string) {
    const trip = await this.getTripDetails(tripId, userId);

    const basePrompt = `
      Act as an expert travel planner. Plan a detailed daily itinerary for a trip to "${trip.destination}" from ${trip.startDate.toDateString()} to ${trip.endDate.toDateString()}.
      It is CRITICAL that you generate exactly one itinerary day for EACH day of the trip. Do not skip any days.
      Budget parameter: ${trip.budget ? '₹' + trip.budget : 'Flexible'}.
      
      ${customPrompt ? `\nUSER SPECIFIC CUSTOMIZATION INSTRUCTIONS:\n${customPrompt}\nPlease strictly adhere to these instructions regarding times, themes, and pace.\n` : ''}

      Output ONLY a pure JSON object containing a "days" array. 
      Each day object MUST have:
      - "dayNumber": integer
      - "theme": string (e.g., "Solang Valley Adventure", or "Old Manali Heritage")
      - "activities": array
      
      Each activity object MUST have:
      - "time": string (e.g., "8:00 AM")
      - "title": string
      - "description": string
      - "type": string (exactly one of: "activity", "food", "hotel", "travel")
      - "locationName": string
      - "costEstimate": number (in local currency, omit symbol)
      - "needsImage": boolean (true if it's a visually striking place/activity, false for standard items)
      
      Make the timeline realistic with proper travel/rest buffers. Output valid JSON only.
    `;

    try {
      const result = await this.generateContent(basePrompt);
      const parsedData = JSON.parse(result);
      const generatedItinerary = parsedData.days || [];
      
      await this.prisma.trip.update({
        where: { id: tripId },
        data: { 
          aiItinerary: generatedItinerary,
          aiCustomPrompt: customPrompt || null,
        }
      });

      return { success: true, generatedItinerary };
    } catch (error: any) {
      console.error('Groq Error (Itinerary):', error?.status || error?.message);
      if (error?.status === 429 || error?.message?.includes('429')) {
        return { success: true, generatedItinerary: this.mockItinerary(trip) };
      }
      throw new InternalServerErrorException('Failed to generate itinerary. Please try again.');
    }
  }

  // ─── Packing List ─────────────────────────────────────────────────
  async generatePackingList(tripId: string, userId: string) {
    const trip = await this.getTripDetails(tripId, userId);

    const prompt = `
      Act as an expert travel preparation guide. Create a highly specific and practical packing list for a ${trip.travelType || 'leisure'} trip to ${trip.destination} between ${trip.startDate.toDateString()} and ${trip.endDate.toDateString()}.
      Consider the exact weather for this specific time of year in ${trip.destination}! Do NOT include generic, obvious items like "T-shirts", "Toothbrush", or "Mobile phone" unless they require a specific variation (e.g. "Moisture-wicking thermal base layers (-5C expected)", "Universal power adapter (Type C/D/M)").
      Include descriptive categories that make sense for this specific destination's terrain/climate (e.g., "High-Altitude Gear", "Monsoon Protection", "Cultural Etiquette Clothing").
      Output ONLY a valid JSON object with category names as keys and arrays of highly descriptive string items as values.
    `;

    try {
      const result = await this.generateContent(prompt);
      const parsedData = JSON.parse(result || '{}');

      await this.prisma.trip.update({
        where: { id: tripId },
        data: { aiPackingList: parsedData }
      });

      return parsedData;
    } catch (error: any) {
      console.error('Groq Error (Packing):', error?.message);
      if (error?.status === 429 || error?.message?.includes('429')) return this.mockPackingList();
      throw new InternalServerErrorException('Failed to generate packing list.');
    }
  }

  // ─── Travel Tips ──────────────────────────────────────────────────
  async generateTravelTips(tripId: string, userId: string) {
    const trip = await this.getTripDetails(tripId, userId);

    const prompt = `
      Act as an expert local guide and survivalist. Provide 6 crucial, non-obvious travel tips, cultural norms, local scams to avoid, and safety warnings strictly specific to visiting ${trip.destination} during the month of ${trip.startDate.toLocaleString('default', { month: 'long' })}.
      Do NOT provide generic tips like "stay hydrated", "wear comfortable shoes", or "respect local culture". 
      Give me highly actionable, hyper-local insider knowledge (e.g., "Avoid the notorious gem scam near the Grand Palace", "Auto drivers overcharge by 300% at the main bus stand; always use the official prepay booth", "Book tickets for X at least 2 days in advance as they sell out by 9 AM").
      Output ONLY a pure JSON object containing a "tips" array of highly descriptive strings.
    `;

    try {
      const result = await this.generateContent(prompt);
      const parsed = JSON.parse(result);
      const tips = parsed.tips || [];

      await this.prisma.trip.update({
        where: { id: tripId },
        data: { aiTravelTips: tips }
      });

      return { tips };
    } catch (error: any) {
      console.error('Groq Error (Tips):', error?.message);
      if (error?.status === 429 || error?.message?.includes('429')) return { tips: this.mockTips(trip.destination) };
      throw new InternalServerErrorException('Failed to generate travel tips.');
    }
  }

  // ─── Destination Info (DB-cached) ────────────────────────────
  async generateDestinationInfo(destination: string) {
    const cached = await this.getDbCache(destination);
    if (cached?.overview && cached?.highlights) {
      console.log(`[AI DB Cache HIT] info: ${destination}`);
      return { overview: cached.overview, highlights: cached.highlights };
    }

    const prompt = `
      Act as an expert travel guide. For "${destination}", provide a comprehensive JSON object with TWO main keys: "overview" and "highlights".
      "overview" must contain: description (3-4 paragraphs), history (2-3 paragraphs), topAttractions (array of 5 strings), weather (typical climate), bestTimeToVisit, language, currency, timezone, transport.
      "highlights" must contain: attractions (array of 6 objects with name, description), thingsToDo (array of 6 objects with name, description), foods (array of 6 objects with name, description), culture (array of 4 objects with name, description).
      Output ONLY valid JSON. Keep descriptions concise but accurate.
    `;

    try {
      const result = await this.generateContent(prompt);
      const cleanJson = result.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanJson || '{}');
      
      if (parsed.overview && parsed.highlights) {
        await this.upsertDbCache(destination, 'overview', parsed.overview);
        await this.upsertDbCache(destination, 'highlights', parsed.highlights);
        console.log(`[AI DB Cache SET] info: ${destination}`);
      }
      return parsed;
    } catch (error: any) {
      console.error('Groq Error (Info):', error?.message);
      return {
        overview: this.mockOverview(destination),
        highlights: this.mockHighlights(destination)
      };
    }
  }

  // ─── Mock fallbacks ───────────────────────────────────────────────
  private mockItinerary(trip: any) {
    return [
      { dayNumber: 1, theme: 'Arrival & Welcome', activities: [
        { time: '10:00 AM', title: 'Hotel Check-in', description: `Arrive in ${trip.destination} and check in.`, costEstimate: 0, type: 'hotel', locationName: 'City Center' },
        { time: '01:00 PM', title: 'Welcome Lunch', description: 'Enjoy a local welcome lunch.', costEstimate: 25, type: 'food', locationName: 'Local Restaurant' },
        { time: '07:00 PM', title: 'Dinner', description: 'Welcome dinner with regional specialties.', costEstimate: 40, type: 'food', locationName: 'Downtown' },
      ]},
      { dayNumber: 2, theme: 'Sightseeing', activities: [
        { time: '09:00 AM', title: 'City Tour', description: 'Visit famous landmarks and historical sites.', costEstimate: 30, type: 'activity', locationName: 'Historical Center', needsImage: true },
        { time: '08:00 PM', title: 'Farewell Dinner', description: 'Farewell dinner.', costEstimate: 50, type: 'food', locationName: 'Riverside' },
      ]},
    ];
  }

  private mockPackingList() {
    return {
      Clothing: ['T-shirts', 'Comfortable walking shoes', 'Jacket', 'Underwear and socks'],
      Toiletries: ['Toothbrush', 'Deodorant', 'Sunscreen', 'Travel shampoo'],
      Electronics: ['Smartphone', 'Power bank', 'Travel adapter', 'Headphones'],
      Documents: ['Passport/ID', 'Travel insurance', 'Booking confirmations', 'Emergency cash'],
    };
  }

  private mockTips(destination: string) {
    return [
      `Always carry ₹500–1000 in local cash for small vendors in ${destination}.`,
      'Learn a few basic phrases in the local language.',
      'Download offline maps on your phone.',
      'Keep emergency contact numbers on a physical card.',
      'Respect local cultural dress codes at religious sites.',
    ];
  }

  private mockOverview(destination: string) {
    return {
      description: `${destination} is a vibrant destination celebrated for its unique culture and rich heritage.`,
      history: `${destination} has a fascinating history spanning centuries.`,
      topAttractions: ['Historic Old Town', 'Natural Landmarks', 'Local Museums', 'Street Food Trail', 'Sacred Temples'],
      bestTimeToVisit: 'October to March for pleasant weather.',
      weather: 'Hot summers, monsoon June–Sep, pleasant winters 15–25°C.',
      language: 'Hindi, English, and local languages',
      currency: 'INR (₹)',
      timezone: 'UTC+05:30 (IST)',
      transport: 'Autos, Buses, Cab (Ola/Uber), Metro',
    };
  }

  private mockHighlights(destination: string) {
    return {
      attractions: [
        { name: 'Old Town Quarter', description: `Historic heart of ${destination}.` },
        { name: 'Central Park', description: 'A serene green escape.' },
        { name: 'Art & History Museum', description: 'Rich cultural collections.' },
        { name: 'Waterfront Promenade', description: 'Scenic waterfront walk.' },
        { name: 'Royal Palace/Fort', description: 'Iconic royal landmark.' },
        { name: 'Night Market', description: 'Street food and local crafts.' },
      ],
      thingsToDo: [
        { name: 'Street Food Tour', description: 'Explore local flavours.' },
        { name: 'Sunrise Viewpoint', description: 'Breathtaking dawn views.' },
        { name: 'Cooking Class', description: 'Learn traditional recipes.' },
        { name: 'Cycling Tour', description: 'Discover hidden gems.' },
        { name: 'Temple Visit', description: 'Experience spiritual ambiance.' },
        { name: 'Day Trip', description: 'Scenic rural escape.' },
      ],
      foods: [
        { name: 'Local Biryani', description: 'Aromatic spiced rice.' },
        { name: 'Street Chaat', description: 'Crispy tangy snacks.' },
        { name: 'Masala Dosa', description: 'Crispy crepe with filling.' },
        { name: 'Filter Coffee', description: 'Traditional strong brew.' },
        { name: 'Seafood Platter', description: 'Fresh catch of the day.' },
        { name: 'Local Sweets', description: 'Traditional confections.' },
      ],
      culture: [
        { name: 'Classical Dance', description: 'Regional dance performances.' },
        { name: 'Temple Festivals', description: 'Vibrant religious celebrations.' },
        { name: 'Handicraft Markets', description: 'Local artisan showcases.' },
        { name: 'Music Scene', description: 'Classical to fusion music.' },
      ],
    };
  }

  // ─── Explore Places Generator ─────────────────────────────────────
  async generateExplorePlaces(destination: string, extraPlaces?: string[]) {
    const key = this.destKey(destination);

    // Check DB cache first
    const cached = await this.prisma.aiDestinationCache.findUnique({ where: { destination: key } });
    if (cached?.explorePlaces) return cached.explorePlaces;

    // Build the destination context — include extra itinerary destinations if provided
    const allDests = [destination];
    if (extraPlaces?.length) allDests.push(...extraPlaces.filter(p => p.toLowerCase() !== destination.toLowerCase()));
    const destContext = allDests.length > 1
      ? `${destination} and nearby areas including ${allDests.slice(1).join(', ')}`
      : destination;

    const prompt = `
      Act as a top-tier travel guide for ${destContext}. Generate a comprehensive list of 18 must-visit places and experiences across ALL these areas.
      Each place MUST have a "category" from EXACTLY these options: "Waterfall", "Mountain", "Temple", "Valley", "Lake", "Adventure", "Cultural", "Historical", "Market", "Nature", "Viewpoint", "Festival", "Hot Spring", "Museum", "Park".
      For each place provide: name, category, description (2-3 sentences), bestTimeToVisit (a short string like "Morning", "All Day", "October-March"), estimatedDuration (like "2-3 hours", "Half Day", "Full Day"), and nearestCity (the nearest town/city from the list: ${allDests.join(', ')}).
      Distribute places across ALL the destinations mentioned, not just the main one.
      Output ONLY a JSON object with a "places" array.
    `;

    try {
      const result = await this.generateContent(prompt);
      const parsed = JSON.parse(result);
      const places = parsed.places || [];

      await this.prisma.aiDestinationCache.upsert({
        where: { destination: key },
        create: { destination: key, explorePlaces: places },
        update: { explorePlaces: places },
      });

      return places;
    } catch (error: any) {
      console.error('Groq Error (Explore):', error?.message);
      return [];
    }
  }
}
