import { NextResponse } from 'next/server';
import { langflowClient } from '@/lib/langflowAPI';

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
        const response = await langflowClient.runFlow(question);
        
        console.log('Full response structure:', JSON.stringify(response, null, 2));
        
        if (!response) {
            throw new Error('No response received from LangFlow');
        }

        // More detailed response handling
        let responseText;
        
        if (response.outputs?.[0]?.outputs?.length > 0) {
            // Standard output format
            responseText = response.outputs[0].outputs[0]?.text ||
                         response.outputs[0].outputs[0]?.message?.text ||
                         response.outputs[0].outputs[0]?.answer;
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
            raw_response: response // Include raw response for debugging
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