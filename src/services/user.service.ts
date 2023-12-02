import { BadRequestError } from "../libs/errors/bad-request-error";
import crypto from "node:crypto"
import { User } from "../models/user.model";

export default class UserService {
    public async userRegisterS(
        accessToken: string, 
        userGoogleId: string,
        email: string
    ): Promise<any> {
        // const users = await User.destroy({
        //     truncate: true
        // })

        // console.log(users);

        const checkUser = await User.findOne({
            where: {
                email,
            }
        });

        if (checkUser) {
            const user = await User.update({
                accessToken,
            },{
                where: {
                    email,
                },
                
            });
            console.log('user updated', user)

            return;
        }

        const user = await User.create({
            accessToken,
            userGoogleId,
            email,
            isPermissionGranted: true
        });

        console.log('user created', user)

        return;
    }
}