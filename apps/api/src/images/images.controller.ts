import { Controller, Get, Query, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

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
        `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${this.unsplashKey}` } },
      );

      if (!res.ok) {
        console.error('Unsplash API error:', res.status, await res.text());
        return {
          imageUrl: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop`,
          source: 'fallback',
        };
      }

      const photo = await res.json();

      if (photo && photo.urls) {
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

  @Get('search')
  async searchImage(
    @Query('query') query: string,
    @Query('destination') destination: string,
    @Res() response: Response
  ) {
    const fallbackImage = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop`;
    
    if (!query || !this.unsplashKey) {
      return response.redirect(fallbackImage);
    }

    try {
      const q = encodeURIComponent(query);
      let res = await fetch(
        `https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${this.unsplashKey}` } }
      );

      let data = await res.json();
      let photo = data.results?.[0];

      // If no photo found for the specific query, fallback to searching just the destination!
      if (!photo && destination) {
        const destQuery = encodeURIComponent(`${destination} travel landscape`);
        res = await fetch(
          `https://api.unsplash.com/search/photos?query=${destQuery}&per_page=1&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${this.unsplashKey}` } }
        );
        data = await res.json();
        photo = data.results?.[0];
      }

      if (photo && photo.urls) {
        return response.redirect(photo.urls.small || photo.urls.regular);
      }
      return response.redirect(fallbackImage);
    } catch (e) {
      return response.redirect(fallbackImage);
    }
  }
}
