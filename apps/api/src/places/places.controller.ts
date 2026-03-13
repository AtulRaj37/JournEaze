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
      // Use Mappls place detail (eLoc)
      const url = `https://atlas.mappls.com/api/places/json?eloc=${encodeURIComponent(placeId)}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `bearer ${token}` },
      });

      if (!res.ok) {
        console.error('Mappls eLoc error:', res.status);
        return { lat: null, lng: null, city: '', country: '' };
      }

      const data = await res.json();
      console.log("eLoc API:", JSON.stringify(data));
      const copResults = data.copResults;

      if (copResults) {
        return {
          lat: copResults.latitude ? parseFloat(copResults.latitude) : null,
          lng: copResults.longitude ? parseFloat(copResults.longitude) : null,
          city: copResults.city || copResults.district || '',
          country: 'India', // Mappls is India-specific
          formattedAddress: copResults.formattedAddress || placeId,
        };
      }

      return { lat: null, lng: null, city: '', country: '' };
    } catch (error) {
      console.error('Mappls place details error:', error);
      return { lat: null, lng: null, city: '', country: '' };
    }
  }
}
