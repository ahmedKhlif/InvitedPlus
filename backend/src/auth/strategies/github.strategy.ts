import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('API_URL', 'https://invitedplus.onrender.com')}/api/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const { id, username, displayName, emails, photos } = profile;
      
      const user = {
        githubId: id,
        email: emails[0].value,
        name: displayName || username,
        avatar: photos[0]?.value,
        provider: 'github',
      };

      const result = await this.authService.validateOAuthUser(user);
      done(null, result);
    } catch (error) {
      done(error, null);
    }
  }
}
