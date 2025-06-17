// types/passport-facebook.d.ts
declare module 'passport-facebook' {
  import { Strategy as PassportStrategy } from 'passport-strategy';

  export interface Profile {
    id: string;
    displayName: string;
    emails?: { value: string }[];
    photos?: { value: string }[];
    provider: string;
    _json?: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    profileFields?: string[];
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
  }

  export { Strategy as FacebookStrategy };
}
