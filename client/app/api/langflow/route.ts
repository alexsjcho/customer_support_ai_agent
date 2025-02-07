import { NextResponse } from 'next/server';
import { langflowClient } from '@/lib/langflowAPI';

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
        const { question } = body;

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        console.log('Processing question:', question);
        const response = await langflowClient.runFlow(question) as LangflowResponse;
        
        console.log('Full response structure:', JSON.stringify(response, null, 2));
        
        if (!response) {
            throw new Error('No response received from LangFlow');
        }

        let responseText: string;
        const outputs = response.outputs?.[0]?.outputs;
        
        if (outputs && outputs.length > 0) {
            // Standard output format
            const firstOutput = outputs[0];
            responseText = firstOutput?.text ?? 
                         firstOutput?.message?.text ?? 
                         firstOutput?.answer ??
                         'No response text available';
        } else if (response.outputs?.[0]?.inputs?.input_value) {
            // When only input is reflected back
            responseText = "I received your message: " + response.outputs[0].inputs.input_value + 
                         ". However, I'm having trouble processing it at the moment. Please try again.";
        } else if (response.session_id) {
            // Session-only response
            responseText = "I've received your message but I'm having trouble generating a response. " +
                         "Please check the LangFlow configuration and try again.";
        } else {
            console.error('Unexpected response format:', response);
            responseText = "I'm currently experiencing technical difficulties. Please try again later.";
        }

        return NextResponse.json({ 
            response: responseText,
            raw_response: response
        });

    } catch (error) {
        console.error('LangFlow API Error:', error);
        return NextResponse.json(
            { 
                error: 'Error processing your request',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 