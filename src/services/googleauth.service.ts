import passport from "passport";
import jwt from 'jsonwebtoken';
import { Request } from "express";

export class GoogleAuthService {
    public googleAuthCallbackS = async (req: Request): Promise<any> => {

        console.log(req.body)

    }

}