import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import AsyncGenerator

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow the Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama Configuration
OLLAMA_DEFAULT_MODEL = "llama2"  # Default model if not set by environment variable
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", OLLAMA_DEFAULT_MODEL)
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")

class Question(BaseModel):
    question: str

SYSTEM_PROMPT = """You are a knowledgeable sports assistant with expertise in all sports worldwide. 
Your responses should be:
1. Accurate and up-to-date
2. Focused on sports-related information
3. Clear and concise
4. Professional but friendly
Please avoid speculation and clearly indicate if you're unsure about any information."""

async def stream_generator(ollama_response: requests.Response) -> AsyncGenerator[str, None]:
    """
    Asynchronous generator to stream Ollama responses.
    
    Args:
        ollama_response (requests.Response): The streaming response from Ollama
        
    Yields:
        str: Content chunks from the response
    """
    try:
        for line in ollama_response.iter_lines():
            if not line:
                continue
                
            try:
                chunk = json.loads(line.decode('utf-8'))
                content = chunk.get('message', {}).get('content', '')
                
                if content:
                    yield content
                
                if chunk.get('done', False):
                    break
                    
            except json.JSONDecodeError as e:
                error_msg = f"STREAM_ERROR: Invalid JSON response from Ollama: {str(e)}"
                print(error_msg)
                yield error_msg
                break
                
    except Exception as e:
        error_msg = f"STREAM_ERROR: Stream processing error: {str(e)}"
        print(error_msg)
        yield error_msg
        
    finally:
        ollama_response.close()

@app.post("/api/chatbot")
async def chatbot_endpoint(request_data: Question):
    """
    Endpoint to handle chat requests and stream responses from Ollama.
    
    Args:
        request_data (Question): The user's question
        
    Returns:
        StreamingResponse: Streamed response from Ollama
    """
    if not request_data.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Check if Ollama is accessible
        try:
            requests.get("http://localhost:11434/api/version", timeout=2)
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Ollama. Please ensure Ollama is running on port 11434."
            )

        payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request_data.question}
            ],
            "stream": True
        }

        response = requests.post(
            OLLAMA_API_URL,
            json=payload,
            stream=True,
            timeout=30  # Add timeout to prevent hanging
        )
        response.raise_for_status()
        
        return StreamingResponse(
            stream_generator(response),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            }
        )

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Request to Ollama timed out. Please try again."
        )
        
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama service. Please ensure Ollama is running."
        )
        
    except requests.exceptions.HTTPError as e:
        error_detail = "Ollama API Error"
        try:
            error_detail = e.response.json().get('error', str(e))
        except:
            error_detail = str(e)
            
        raise HTTPException(
            status_code=e.response.status_code or 500,
            detail=error_detail
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )
