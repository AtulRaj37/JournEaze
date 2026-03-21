import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'NOT_SET',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'NOT_SET',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { emails, displayName, photos } = profile;
        const user = {
            email: emails?.[0]?.value || `${profile.id}@google.oauth`,
            name: displayName || 'Google User',
            image: photos?.[0]?.value || null,
        };
        done(null, user);
    }
}
