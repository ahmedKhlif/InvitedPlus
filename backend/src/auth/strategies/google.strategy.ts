import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const apiUrl = configService.get<string>('API_URL', 'https://invitedplus.onrender.com');
    const callbackURL = `${apiUrl}/api/auth/google/callback`;
    
    console.log('Google OAuth Config:', {
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ? 'SET' : 'NOT SET',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ? 'SET' : 'NOT SET',
      apiUrl,
      callbackURL
    });

    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      
      const user = {
        googleId: id,
        email: emails[0].value,
        name: name.givenName + ' ' + name.familyName,
        avatar: photos[0]?.value,
        provider: 'google',
      };

      const result = await this.authService.validateOAuthUser(user);
      done(null, result);
    } catch (error) {
      done(error, null);
    }
  }
}
