import { Request, Response } from "express";
import { GoogleAuthService } from "../services/googleauth.service";

export class GoogleAuthController extends GoogleAuthService {

    public googleAuthCallback = async (
        req: Request,
        res: Response
    ): Promise<any> => {
        try {
            const user = await this.googleAuthCallbackS(req);
            res.send()
        } catch (err) {
            console.error(err);
            res.send()
        }
    }
}