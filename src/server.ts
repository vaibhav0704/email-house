import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import { errorHandler } from "./libs/middlewares/error-handler";
import router from "./routes/index";
import passport from "passport";
import './libs/strategies/google.strategy'
import sequelize from "./libs/clients/db.client";
import cron from 'node-cron';
import { EmailService } from "./services/email.service";

dotenv.config()

const app: express.Application = express();

// check if in dev environment
const isDevMode = (process.env.NODE_ENV === 'development');
console.log(`Starting server in ${isDevMode ? 'dev' : 'prod'} mode 🚀🚀`)

app.use(
    cors({
        origin: "*"
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(passport.initialize());

app.use(errorHandler);
app.use('/', router)

const port = process.env.PORT || 5000;

const emailService = new EmailService()

const initServer = async () => {    
    try {
        await sequelize.sync();
        console.log('db connected')
        app.listen(port, async () => {
            console.log(`Server sarted running on port ${port}`);

            // cron scheduled to run every 2 minutes i.e 120s
            cron.schedule('*/60 * * * * *', () => {
                console.log('initializing email service!!')
                emailService.initiateEmailService();
            })
        });
    } catch (err) {
        console.error(err)
    }
}

initServer()