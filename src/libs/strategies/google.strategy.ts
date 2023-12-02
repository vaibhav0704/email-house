import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv'
import UserService from '../../services/user.service';

dotenv.config()

// User service to create a new user
const userService = new UserService();

/**
 * Google oauth2 strategy defines the expiry time
 * of access token which carries scope to access 
 * the gmail apis
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/auth/callback',
    },
    async (accessToken, refreshToken, profile, done) => {

      // call the user service to create new user with required data
      const email = profile.emails ? profile.emails[0].value : '' 
      await userService.userRegisterS(accessToken, profile.id, email);
      
      return done(null, profile);
    }
  )
);
