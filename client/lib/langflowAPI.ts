import { DataAPIClient } from "@datastax/astra-db-ts";

// Constants
const ENDPOINT = 'customer';
const CHAT_TYPE = 'chat';
const APPLICATION_TOKEN = process.env.LANGFLOW_APP_TOKEN;
const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
const BASE_API_URL = "https://api.langflow.astra.datastax.com";
const ASTRA_DB_URL = "https://e267e085-5b3e-4d6d-b262-82758bde8551-us-east-2.apps.astra.datastax.com";
const LANGFLOW_ID = "a5009329-f160-4608-9993-09b6eab36a1f";
const FLOW_ID = "7cba4c06-78c2-44c6-bd24-ae491c1c8615";

// Types
interface Headers {
    [key: string]: string;
}

interface StreamResponse {
    chunk: string;
    // Add other potential stream response properties
}

interface ComponentOutput {
    outputs: {
        message: {
            text: string;
        };
    };
    artifacts?: {
        stream_url?: string;
    };
}

interface FlowOutput {
    outputs: ComponentOutput[];
}

interface InitResponse {
    outputs?: FlowOutput[];
    result?: string;
}

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
        if (!ASTRA_DB_TOKEN) {
            throw new Error('ASTRA_DB_TOKEN environment variable is not set');
        }

        this.baseURL = BASE_API_URL;
        this.applicationToken = APPLICATION_TOKEN;
        
        // Initialize AstraDB client
        this.dbClient = new DataAPIClient(ASTRA_DB_TOKEN);
        this.db = this.dbClient.db(ASTRA_DB_URL);
        
        // Initialize database connection and collection
        this.initializeDatabase();
    }

    private async initializeDatabase() {
        try {
            // List existing collections
            const collections = await this.db.listCollections();
            console.log('Existing collections:', collections);

            // Check if our collection exists
            const collectionExists = collections.some(
                (coll: { name: string }) => coll.name === this.COLLECTION_NAME
            );

            // Create collection if it doesn't exist
            if (!collectionExists) {
                console.log(`Creating collection: ${this.COLLECTION_NAME}`);
                await this.db.createCollection(this.COLLECTION_NAME);
                
                // Create indexes for better query performance
                const collection = this.db.collection(this.COLLECTION_NAME);
                await collection.createIndex({ timestamp: 1 });
                await collection.createIndex({ type: 1 });
            }

            this.collectionInitialized = true;
            console.log('Database initialization complete');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    private async ensureCollection() {
        if (!this.collectionInitialized) {
            await this.initializeDatabase();
        }
    }

    private async storeMessage(message: string) {
        try {
            await this.ensureCollection();
            await this.db.collection(this.COLLECTION_NAME).insertOne({
                type: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error storing message in AstraDB:', error);
            // Don't throw the error to prevent blocking the main flow
        }
    }

    private async storeResponse(response: InitResponse) {
        try {
            await this.ensureCollection();
            await this.db.collection(this.COLLECTION_NAME).insertOne({
                type: 'assistant',
                content: response.result || JSON.stringify(response),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error storing response in AstraDB:', error);
            // Don't throw the error to prevent blocking the main flow
        }
    }

    async post(endpoint: string, body: any, headers: Headers = {"Content-Type": "application/json"}): Promise<any> {
        headers["Authorization"] = `Bearer ${this.applicationToken}`;
        headers["Content-Type"] = "application/json";
        const url = `${this.baseURL}${endpoint}`;
        
        console.log('Making request to:', url);
        console.log('With headers:', headers);
        console.log('With body:', body);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            const responseMessage = await response.json();
            console.log('Raw API Response:', responseMessage);

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(responseMessage)}`);
            }
            return responseMessage;
        } catch (error) {
            console.error('Request Error:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    async initiateSession(
        flowId: string,
        langflowId: string,
        inputValue: string,
        inputType: string = CHAT_TYPE,
        outputType: string = CHAT_TYPE,
        stream: boolean = false
    ): Promise<InitResponse> {
        const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
        
        // Try different input formats
        const body = {
            inputs: {
                text: inputValue,
                chat_history: [],
                question: inputValue,  // Some flows expect 'question'
                input: inputValue,     // Some flows expect 'input'
                messages: [{           // Some flows expect chat messages
                    role: "user",
                    content: inputValue
                }]
            },
            input_value: inputValue,   // Legacy format
            input_type: inputType,
            output_type: outputType
        };

        console.log('Request body:', JSON.stringify(body, null, 2));
        return this.post(endpoint, body);
    }

    handleStream(
        streamUrl: string,
        onUpdate: (data: StreamResponse) => void,
        onClose: (message: string) => void,
        onError: (error: Event | string) => void
    ): EventSource {
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            onUpdate(data);
        };

        eventSource.onerror = (event: Event) => {
            console.error('Stream Error:', event);
            onError(event);
            eventSource.close();
        };

        eventSource.addEventListener("close", () => {
            onClose('Stream closed');
            eventSource.close();
        });

        return eventSource;
    }

    async runFlow(message: string): Promise<InitResponse | void> {
        const flowIdOrName = FLOW_ID;
        const langflowId = LANGFLOW_ID;
        const inputType = CHAT_TYPE;
        const outputType = CHAT_TYPE;
        const stream = false;

        try {
            console.log('Starting flow run with message:', message);
            console.log('Using Flow ID:', flowIdOrName);
            console.log('Using Langflow ID:', langflowId);
            
            // Store the message in AstraDB
            await this.storeMessage(message);
            
            const initResponse = await this.initiateSession(
                flowIdOrName,
                langflowId,
                message,
                inputType,
                outputType,
                stream
            );
            
            console.log('Raw Init Response:', JSON.stringify(initResponse, null, 2));
            
            // If we have a response, store it in AstraDB
            if (initResponse) {
                await this.storeResponse(initResponse);
            }
            
            return initResponse;
        } catch (error) {
            console.error('Error running flow:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const langflowClient = new LangflowClient(); 