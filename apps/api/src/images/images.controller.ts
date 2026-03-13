import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('images')
export class ImagesController {
  private readonly unsplashKey: string;

  constructor(private readonly config: ConfigService) {
    this.unsplashKey = this.config.get<string>('UNSPLASH_ACCESS_KEY') || '';
  }

  @Get('destination')
  async getDestinationImage(@Query('city') city: string) {
    if (!city) {
      throw new HttpException('city query parameter is required', HttpStatus.BAD_REQUEST);
    }

    if (!this.unsplashKey) {
      // Return a high-quality fallback when no key is configured
      return {
        imageUrl: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop`,
        source: 'fallback',
      };
    }

    try {
      const query = encodeURIComponent(`${city} travel landscape`);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${this.unsplashKey}` } },
      );

      if (!res.ok) {
        console.error('Unsplash API error:', res.status, await res.text());
        return {
          imageUrl: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop`,
          source: 'fallback',
        };
      }

      const data = await res.json();
      const photo = data.results?.[0];

      if (photo) {
        return {
          imageUrl: photo.urls.regular,
          photographer: photo.user?.name,
          source: 'unsplash',
        };
      }

      return {
        imageUrl: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop`,
        source: 'fallback',
      };
    } catch (error) {
      console.error('Unsplash fetch error:', error);
      return {
        imageUrl: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop`,
        source: 'fallback',
      };
    }
  }
}
