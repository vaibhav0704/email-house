import { Router } from "express";
import passport from "passport";
import { GoogleAuthController } from "../controllers/googleauth.controller";

const authRouter = Router();
const { googleAuthCallback } = new GoogleAuthController()

authRouter.get('/initauth', passport.authenticate('google', { scope: ['profile', 'https://mail.google.com', 'email'] }));
authRouter.get('/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/initAuth' }), googleAuthCallback);

export default authRouter;