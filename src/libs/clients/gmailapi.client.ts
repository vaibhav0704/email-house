import axios, { AxiosInstance } from "axios";
import { CustomError } from "../errors/custom-error";

export class GmailApiClient {
    private axiosClient: AxiosInstance;

    constructor(accessToken: string) {
        this.axiosClient = axios.create({
            baseURL: 'https://gmail.googleapis.com',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    public async sendRequest(endpoint: string, method: string, data?:any): Promise<any> {
        try {
            const response = await this.axiosClient.request({
                url: endpoint,
                method: method,
                data: data,
            });
    
            return response.data;
        } catch (err) {
            // console.error(err);
        }
    }
}