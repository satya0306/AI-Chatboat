import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

# Ollama Configuration
OLLAMA_DEFAULT_MODEL = "llama2"  # Default model if not set by environment variable
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", OLLAMA_DEFAULT_MODEL)
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat") # Ollama API endpoint

class Question(BaseModel):
    question: str

async def stream_generator(ollama_response: requests.Response):
    """
    Asynchronous generator to iterate over the Ollama streaming response,
    parse each JSON line, extract content, and yield it.
    """
    try:
        for line in ollama_response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                try:
                    chunk = json.loads(decoded_line)
                    content = chunk.get('message', {}).get('content', '')
                    if content:
                        yield content
                    
                    # Check if the stream is done (Ollama specific field)
                    if chunk.get('done') and not content: # if done is true and there's no more content in this chunk
                        break
                except json.JSONDecodeError:
                    print(f"Error decoding JSON line: {decoded_line}")
                    # Optionally yield an error message or handle as appropriate
                    yield f"STREAM_ERROR: Could not parse JSON chunk: {decoded_line}"
                    break 
                except Exception as e:
                    print(f"Error processing chunk: {e}")
                    yield f"STREAM_ERROR: An error occurred processing a stream chunk: {str(e)}"
                    break
    except Exception as e:
        print(f"Error during streaming: {e}")
        yield f"STREAM_ERROR: An unexpected error occurred during streaming: {str(e)}"
    finally:
        ollama_response.close()


@app.post("/api/chatbot")
async def chatbot_endpoint(request_data: Question):
    user_question = request_data.question
    if not user_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    ollama_model_name = OLLAMA_MODEL

    payload = {
        "model": ollama_model_name,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant knowledgeable about all sports."},
            {"role": "user", "content": user_question}
        ],
        "stream": True
    }

    try:
        # Make a POST request to the Ollama API
        response = requests.post(OLLAMA_API_URL, json=payload, stream=True)
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
        
        # Return a StreamingResponse using the generator
        return StreamingResponse(stream_generator(response), media_type="text/event-stream")

    except requests.exceptions.ConnectionError as e:
        print(f"Ollama Connection Error: {e}")
        raise HTTPException(status_code=503, detail="Could not connect to Ollama service. Please ensure Ollama is running.")
    except requests.exceptions.HTTPError as e:
        # Handle HTTP errors from Ollama if they were not caught by stream_generator
        # (e.g. if Ollama itself returns a non-200 error before streaming starts properly)
        print(f"Ollama HTTP Error: {e}")
        error_detail = f"Ollama API Error: {e.response.status_code} - {e.response.text}"
        try:
            # Try to parse if Ollama returns JSON error
            ollama_error = e.response.json()
            error_detail = f"Ollama API Error: {ollama_error.get('error', e.response.text)}"
        except ValueError:
            pass # Keep the original text if not JSON
        raise HTTPException(status_code=e.response.status_code or 500, detail=error_detail)
    except Exception as e:
        # Handle other potential errors
        print(f"Generic Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
