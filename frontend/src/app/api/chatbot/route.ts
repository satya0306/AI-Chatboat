import { NextResponse } from 'next/server';

// FastAPI backend URL - can be configured via environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000/';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();

    // Forward the request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}api/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if the response is ok
    if (!response.ok) {
      // Try to get error details from the response
      let errorDetail;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || `Backend error: ${response.status} ${response.statusText}`;
      } catch {
        errorDetail = `Backend error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // Create a ReadableStream from the FastAPI response
    const stream = response.body;
    if (!stream) {
      throw new Error('No response stream from backend');
    }

    // Return a streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in chatbot API route:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        detail: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: '/api/chatbot'
      },
      { 
        status: error instanceof Error && error.message.includes('Backend error: ') ? 502 : 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 