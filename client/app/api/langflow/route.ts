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
        } else if (response.outputs?.[0]?.inputs?.text) {
            // Input reflection format
            responseText = response.outputs[0].inputs.text;
        } else if (response.session_id) {
            // Session-only response
            responseText = "Session initialized, but no response generated yet.";
        } else if (typeof response === 'string') {
            // Direct string response
            responseText = response;
        } else if (response.result) {
            // Result field response
            responseText = response.result;
        } else {
            console.error('Unexpected response format:', response);
            responseText = "Unable to process response format";
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