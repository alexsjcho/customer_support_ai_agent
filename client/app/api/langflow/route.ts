import { NextResponse } from 'next/server';
import { LangflowClient } from '@/lib/langflowAPI';

interface MessageOutput {
    text?: string;
    message?: {
        text?: string;
    };
    answer?: string;
}

interface LangflowOutput {
    outputs?: MessageOutput[];
    inputs?: {
        input_value?: string;
    };
}

interface LangflowResponse {
    outputs?: LangflowOutput[];
    session_id?: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const client = new LangflowClient();
        const response = await client.runFlow(message);

        return NextResponse.json({ response });
    } catch (error) {
        console.error('API Route Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process request', 
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 