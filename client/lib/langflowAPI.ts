import { DataAPIClient } from "@datastax/astra-db-ts";

// Types
interface Headers {
    [key: string]: string;
}

interface StreamResponse {
    chunk: string;
}

interface FlowOutput {
    outputs: {
        [CHAT_TYPE]: {
            results: {
                message: {
                    text: string;
                }
            }
        };
    }[];
}

interface InitResponse {
    outputs?: FlowOutput[];
}

// Constants
const ENDPOINT = 'customer';
const CHAT_TYPE = 'chat';
const APPLICATION_TOKEN = process.env.LANGFLOW_APP_TOKEN;
const BASE_API_URL = "https://api.langflow.astra.datastax.com";
const LANGFLOW_ID = "a5009329-f160-4608-9993-09b6eab36a1f";
const FLOW_ID = "7cba4c06-78c2-44c6-bd24-ae491c1c8615";
const ASTRA_DB_URL = "https://e267e085-5b3e-4d6d-b262-82758bde8551-us-east-2.apps.astra.datastax.com";

export class LangflowClient {
    private baseURL: string;
    private applicationToken: string;
    private dbClient: DataAPIClient;
    private db: any;
    private readonly COLLECTION_NAME = 'chat_messages';
    private collectionInitialized = false;

    constructor() {
        if (!APPLICATION_TOKEN) {
            throw new Error('LANGFLOW_APP_TOKEN environment variable is not set');
        }

        this.baseURL = BASE_API_URL;
        this.applicationToken = APPLICATION_TOKEN;
        
        // Initialize AstraDB client if token exists
        if (process.env.ASTRA_DB_TOKEN) {
            this.dbClient = new DataAPIClient(process.env.ASTRA_DB_TOKEN);
            this.db = this.dbClient.db(ASTRA_DB_URL);
            this.initializeDatabase();
        }
    }

    private async initializeDatabase() {
        try {
            const collections = await this.db.listCollections();
            const collectionExists = collections.some(
                (coll: { name: string }) => coll.name === this.COLLECTION_NAME
            );

            if (!collectionExists) {
                await this.db.createCollection(this.COLLECTION_NAME);
                const collection = this.db.collection(this.COLLECTION_NAME);
                await collection.createIndex({ timestamp: 1 });
                await collection.createIndex({ type: 1 });
            }

            this.collectionInitialized = true;
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    private async storeMessage(message: string) {
        try {
            if (!this.collectionInitialized) {
                await this.initializeDatabase();
            }
            await this.db.collection(this.COLLECTION_NAME).insertOne({
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error storing message:', error);
        }
    }

    async post(endpoint: string, body: any): Promise<any> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            "Authorization": `Bearer ${this.applicationToken}`,
            "Content-Type": "application/json"
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Request Error:', error);
            throw error;
        }
    }

    async runFlow(message: string): Promise<string> {
        try {
            // Store the message if AstraDB is initialized
            if (this.collectionInitialized) {
                await this.storeMessage(message);
            }

            // Match Python client endpoint structure
            const endpoint = `/lf/${LANGFLOW_ID}/api/v1/run/${ENDPOINT}`;
            
            // Match Python client payload structure
            const payload = {
                input_value: message,
                output_type: CHAT_TYPE,
                input_type: CHAT_TYPE
            };

            const response = await this.post(endpoint, payload);
            
            // Extract text from response matching Python client structure
            const responseText = response.outputs[0].outputs[0].results.message.text;
            return responseText;

        } catch (error) {
            console.error('Error running flow:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const langflowClient = new LangflowClient(); 