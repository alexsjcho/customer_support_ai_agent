import dotenv from 'dotenv';
dotenv.config();

// Constants
const ENDPOINT = 'customer';
const CHAT_TYPE = 'chat';
const APPLICATION_TOKEN = process.env.APP_TOKEN;
const BASE_API_URL = "https://api.langflow.astra.datastax.com"
const LANGFLOW_ID = "a5009329-f160-4608-9993-09b6eab36a1f"
const FLOW_ID = "7cba4c06-78c2-44c6-bd24-ae491c1c8615"

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
}

class LangflowClient {
    private baseURL: string;
    private applicationToken: string;

    constructor() {
        if (!APPLICATION_TOKEN) {
            throw new Error('APP_TOKEN environment variable is not set');
        }
        this.baseURL = BASE_API_URL;
        this.applicationToken = APPLICATION_TOKEN;
    }

    async post(endpoint: string, body: any, headers: Headers = {"Content-Type": "application/json"}): Promise<any> {
        headers["Authorization"] = `Bearer ${this.applicationToken}`;
        headers["Content-Type"] = "application/json";
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            const responseMessage = await response.json();
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
        return this.post(endpoint, { 
            input_value: inputValue, 
            input_type: inputType, 
            output_type: outputType
        });
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

    async runFlow(
        message: string
    ): Promise<InitResponse | void> {
        const flowIdOrName = FLOW_ID;
        const langflowId = LANGFLOW_ID;
        const inputType = CHAT_TYPE;
        const outputType = CHAT_TYPE;
        const stream = false;

        try {
            const initResponse = await this.initiateSession(
                flowIdOrName,
                langflowId,
                message,
                inputType,
                outputType,
                stream
            );
            console.log('Init Response:', initResponse);
            
            if (stream && initResponse?.outputs?.[0]?.outputs?.[0]?.artifacts?.stream_url) {
                const streamUrl = initResponse.outputs[0].outputs[0].artifacts.stream_url;
                console.log(`Streaming from: ${streamUrl}`);
                this.handleStream(
                    streamUrl,
                    (data) => console.log("Received:", data.chunk),
                    (message) => console.log("Stream Closed:", message),
                    (error) => console.log("Stream Error:", error)
                );
            }
            return initResponse;
        } catch (error) {
            console.error('Error running flow:', error);
            console.error('Error initiating session');
        }
    }
} 