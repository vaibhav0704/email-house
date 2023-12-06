import { GmailApiClient } from "../libs/clients/gmailapi.client";
import { createMimeMessage } from 'mimetext';
import { User } from "../models/user.model";

interface Threads {
    id: string,
    snippet: string,
    historyId: string
}

interface MailerObject {
    threadId: string,
    messageId: string,
    recipientEmail: string
}

export class EmailService {
    private gmailApiClient = new GmailApiClient('');

    /**
     * checks if the provided dateString belongs to the 
     * current day
     * 
     * @param dateString 
     * @returns bolean
     */
    private isDateInCurrentDay = (dateString: string): boolean => {
        const inputDate = new Date(dateString);

        const currentDate = new Date();

        const isSameDay =
            inputDate.getDate() === currentDate.getDate() &&
            inputDate.getMonth() === currentDate.getMonth() &&
            inputDate.getFullYear() === currentDate.getFullYear();

        return isSameDay;
    }

    /**
     * function to get all threads of the user
     * 
     * @param userId 
     * @returns Threads[]
     */
    private getThreadsOfUser = async (userId: string): Promise<Threads[]> => {
        const data = await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/threads`, 'GET');

        if (data.threads && data.threads.length) {
            return data.threads
        } else {
            return []
        }
    };

    /**
     * function to get the data of a thread and checks
     * if the thread is been replied by a user and the 
     * thread's last message was sent on the same day
     * then returns the message id to which the Email 
     * Service must reply
     * 
     * @param userId 
     * @param threadId 
     * @returns 
     */
    private getThreadDataAndCheckIfNotAttended = async (userId: string, threadId: string): Promise<MailerObject | null> => {
        const thread: any = await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/threads/${threadId}`, 'GET');

        const messages: Array<any> = thread.messages;
        
        // checks if the message contains the SENT labelId and the last mesage on the thread was received on the same day
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].labelIds?.some((label: string) => label === 'SENT')) return null;

            // if last message of a thread
            if (i === messages.length -1) {
                const dateObj = messages[i].payload.headers.find((header: any) => header.name === 'Date');
                const dateOfMessage = dateObj.value;
                if (!this.isDateInCurrentDay(dateOfMessage)) return null;

                const fromHeader = messages[i].payload.headers.find((header: any) => header.name === 'From');
                const recipientEmail = fromHeader.value.split(/[<>]/)[1];
                return { threadId: messages[i].threadId, messageId: messages[i].id, recipientEmail };
            }
        };

        return null;
    };

    /**
     * returns the array of message Ids the Email Service 
     * must respond to
     * 
     * @param userId 
     * @returns Array<any>
     */
    private getThreadsToBeReplied = async (userId: string): Promise<Array<MailerObject | null>> => {
        const threads = await this.getThreadsOfUser(userId);

        // use promise.all() so that the promises resolve simultaneously making the algorithm work faster
        const threadPromise: Array<Promise<MailerObject | null>> = [];

        for (const thread of threads) {
            threadPromise.push(new Promise((resolve, reject) => {
                resolve(this.getThreadDataAndCheckIfNotAttended(userId, thread.id))
            }))
        };

        const threadIds = await Promise.all(threadPromise);

        return threadIds;
    };

    /**
     * checks if the label exists on user's email
     * and creates one if it doesn't exists
     * 
     * @param userId 
     * @returns Promise<void>
     */
    private checkForLabelAndCreateLabel = async (userId: string): Promise<string> => {
        const data = await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/labels`, 'GET');
        const labels = data.labels;


        let ifLabelExists = false;
        if (labels && labels.length) {
            ifLabelExists = labels.some((label: any) => label.name === 'SENT_BY_EMAILHOUSE')
        };


        if (!ifLabelExists) {
            const labelObject = {
                name: "SENT_BY_EMAILHOUSE",
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
            };
            const response = await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/labels`, 'POST', labelObject);
            return response.id 
        } else {
            const label = labels.find((label: any) => label.name === 'SENT_BY_EMAILHOUSE')
            return label.id;
        }
        
        
    };

    /**
     * function to send an email as a response to the last 
     * message sent in the email thread
     * 
     * @param mailerObject 
     * @param email 
     * @param userId 
     * @returns Promise<void>
     */
    private replyToMessage = async (mailerObject: MailerObject, email: string, userId: string, labelId: string): Promise<void> => {
        const message = createMimeMessage()

        const body = "Hey, I have received your email, but at the moment I am on leave. I wll reachout to you ASAP"

        message.setSender(email);
        message.setRecipient(mailerObject.recipientEmail);
        message.setSubject('Will attend your message soon');
        message.addMessage({ contentType: 'text/plain', data: body });

        message.setHeader('In-Reply-To', mailerObject.messageId);
        message.setHeader('References', mailerObject.messageId);

        const raw = message.asRaw();

        const encodedMessage = Buffer.from(raw)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const messageObj = {
            raw: encodedMessage,
            threadId: mailerObject.threadId,
        };

        const response = await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/messages/send`, 'POST', messageObj);
        
        // update the message with label
        await this.gmailApiClient.sendRequest(`/gmail/v1/users/${userId}/messages/${response.id}/modify`, 'POST', {
            addLabelIds: [labelId]
        })

        return;
    };

    /**
     * gets all the threads to be replied to
     * and sends the message to the given threads
     * 
     * @param userGoogleId 
     * @param email 
     * @param accessToken 
     * @returns 
     */
    private getThreadsAndSendEmail = async (userGoogleId: string, email: string, accessToken: string): Promise<void[]> => {
        // initialize gmailApiClient for the user
        this.gmailApiClient = new GmailApiClient(accessToken);

        const threadsToBeReplied = await this.getThreadsToBeReplied(userGoogleId);

        const labelId = await this.checkForLabelAndCreateLabel(userGoogleId);

        const replyMessagePromises: Array<Promise<void>>= [];

        for (const thread of threadsToBeReplied) {
            if (thread) {
                replyMessagePromises.push(new Promise((resolve: any, reject: any) => {
                    resolve(this.replyToMessage(thread, email, userGoogleId, labelId))
                }))
            }
        };

        const replies = await Promise.all(replyMessagePromises);

        return replies;
    }

    /**
     * for every user in the database it calls
     * this.getThreadsAndSendEmail fundtion to initiate the 
     * email service.
     * 
     * @returns 
     */
    public initiateEmailService = async (): Promise<void[]> => {
        const users = await User.findAll({
            where: {
                isPermissionGranted: true
            }
        });

        const userHandlerPromises: Promise<void>[]= [];

        for (const user of users) {
            new Promise((resolve, reject) => {
                resolve(this.getThreadsAndSendEmail(user.userGoogleId, user.email, user.accessToken))
            })
        };

        const usersHandled = await Promise.all(userHandlerPromises);

        return usersHandled;
    }
}