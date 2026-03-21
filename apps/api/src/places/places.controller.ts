import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('places')
export class PlacesController {
  private readonly mapplsRestKey: string;
  private readonly mapplsClientId: string;
  private readonly mapplsClientSecret: string;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {
    this.mapplsRestKey = this.config.get<string>('MAPPLS_REST_KEY') || '';
    this.mapplsClientId = this.config.get<string>('MAPPLS_CLIENT_ID') || '';
    this.mapplsClientSecret = this.config.get<string>('MAPPLS_CLIENT_SECRET') || '';
  }

  /**
   * Get OAuth2 access token from Mappls
   * Falls back to using REST key directly
   */
  private async getAccessToken(): Promise<string> {
    // If we have client_id + client_secret, use OAuth2
    if (this.mapplsClientId && this.mapplsClientSecret) {
      // Check cached token
      if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
        return this.cachedToken.token;
      }

      try {
        const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${this.mapplsClientId}&client_secret=${this.mapplsClientSecret}`,
        });

        if (res.ok) {
          const data = await res.json();
          const token = data.access_token;
          const expiresIn = (data.expires_in || 86400) * 1000; // ms
          this.cachedToken = { token, expiresAt: Date.now() + expiresIn - 60000 };
          return token;
        }
        console.error('Mappls OAuth error:', res.status, await res.text());
      } catch (err) {
        console.error('Mappls OAuth fetch error:', err);
      }
    }

    // Fallback: use REST key directly
    return this.mapplsRestKey;
  }

  @Get('autocomplete')
  async autocomplete(@Query('input') input: string) {
    if (!input || input.length < 2) {
      return { predictions: [] };
    }

    const token = await this.getAccessToken();
    if (!token) {
      console.error('No Mappls API key or OAuth credentials configured');
      return { predictions: [] };
    }

    try {
      // Try the Mappls autosuggest API
      const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(input)}&tokenizeAddress=true`;
      const res = await fetch(url, {
        headers: { 'Authorization': `bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text();
        console.error('Mappls autosuggest error:', res.status, body);
        return { predictions: [] };
      }

      const data = await res.json();
      const places = data.suggestedLocations || [];

      // Transform Mappls response to a unified format
      const predictions = places.map((p: any) => ({
        place_id: p.eLoc || p.placeName || '',
        description: [p.placeName, p.placeAddress].filter(Boolean).join(', '),
        placeName: p.placeName || '',
        placeAddress: p.placeAddress || '',
        latitude: p.latitude ? parseFloat(p.latitude) : null,
        longitude: p.longitude ? parseFloat(p.longitude) : null,
        type: p.type || '',
        city: p.city || p.placeName || '',
        state: p.state || '',
        country: p.country || 'India',
      }));

      return { predictions };
    } catch (error) {
      console.error('Mappls autocomplete error:', error);
      return { predictions: [] };
    }
  }

  @Get('details')
  async placeDetails(@Query('place_id') placeId: string) {
    if (!placeId) {
      return { lat: null, lng: null, city: '', country: '' };
    }

    const token = await this.getAccessToken();
    if (!token) {
      return { lat: null, lng: null, city: '', country: '' };
    }

    try {
      const isEloc = /^[a-zA-Z0-9]{6}$/.test(placeId);
      const url = isEloc 
        ? `https://atlas.mappls.com/api/places/json?eloc=${encodeURIComponent(placeId)}`
        : `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(placeId)}`;

      const res = await fetch(url, { headers: { 'Authorization': `bearer ${token}` } });

      if (!res.ok) {
        console.error(`Mappls error for ${placeId}:`, res.status, await res.text());
        return { lat: null, lng: null, city: '', country: '' };
      }

      const data = await res.json();
      console.log("Mappls API response:", JSON.stringify(data));
      
      const copResults = Array.isArray(data.copResults) ? data.copResults[0] : data.copResults;

      if (copResults) {
        return {
          lat: copResults.latitude ? parseFloat(copResults.latitude) : null,
          lng: copResults.longitude ? parseFloat(copResults.longitude) : null,
          city: copResults.city || copResults.district || placeId,
          country: 'India',
          formattedAddress: copResults.formattedAddress || placeId,
        };
      }

      return { lat: null, lng: null, city: '', country: '' };
    } catch (error) {
      console.error('Mappls place details error:', error);
      return { lat: null, lng: null, city: '', country: '' };
    }
  }

  // ─── Nearby POI Search (Overpass API proxy) ──────────────────────
  @Get('nearby')
  async nearbySearch(
    @Query('type') type: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('destination') destination: string,
    @Query('waypoints') waypointsStr?: string,
  ) {
    // Map user-friendly type names to OSM tags
    const osmTagMap: Record<string, string> = {
      restaurant: 'amenity=restaurant',
      hotel: 'tourism=hotel',
      atm: 'amenity=atm',
      hospital: 'amenity=hospital',
      airport: 'aeroway=aerodrome',
      petrol: 'amenity=fuel',
      pharmacy: 'amenity=pharmacy',
      cafe: 'amenity=cafe',
      bus: 'amenity=bus_station',
      train: 'railway=station',
    };

    const tag = osmTagMap[(type || '').toLowerCase()] || `amenity=${(type || 'restaurant').toLowerCase()}`;
    const [tagKey, tagVal] = tag.split('=');

    let overpassQuery = '';

    // If multiple waypoints, do a union query to get POIs along the entire route in ONE request
    if (waypointsStr) {
      const waypoints = waypointsStr.split('|').map(w => w.split(',').map(Number));
      const validWaypoints = waypoints.filter(wp => !isNaN(wp[0]) && !isNaN(wp[1]));
      // Cap at 15 waypoints to avoid over-taxing Overpass API
      const wpToUse = validWaypoints.slice(0, 15);
      
      if (wpToUse.length === 0) {
        return { places: [] };
      }
      
      const statements = wpToUse.map(wp => `node["${tagKey}"="${tagVal}"](around:2500,${wp[0]},${wp[1]});`).join('\n      ');
      
      overpassQuery = `
        [out:json][timeout:25];
        (
          ${statements}
        );
        out body 50;
      `;
    } else {
      let searchLat = parseFloat(lat);
      let searchLng = parseFloat(lng);

      // If no valid coords, geocode the destination
      if (!searchLat || !searchLng || isNaN(searchLat) || isNaN(searchLng)) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination || 'Manali')}&limit=1`,
            { headers: { 'User-Agent': 'JournEaze/1.0', 'Accept-Language': 'en' } },
          );
          const geoData = await geoRes.json();
          if (geoData?.[0]) {
            searchLat = parseFloat(geoData[0].lat);
            searchLng = parseFloat(geoData[0].lon);
          } else {
            return { places: [] };
          }
        } catch {
          return { places: [] };
        }
      }

      // Single point search (5km radius)
      overpassQuery = `
        [out:json][timeout:25];
        node["${tagKey}"="${tagVal}"](around:5000,${searchLat},${searchLng});
        out body 30;
      `;
    }

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!res.ok) {
        console.error('Overpass API error:', res.status);
        return { places: [] };
      }

      const data = await res.json();
      const places = (data.elements || []).map((el: any) => ({
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.name || `${type} (unnamed)`,
        type: type,
      }));

      return { places };
    } catch (error) {
      console.error('Overpass fetch error:', error);
      return { places: [] };
    }
  }
}
