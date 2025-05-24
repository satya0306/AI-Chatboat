import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai

app = FastAPI()

# Load OpenAI API Key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    # This will prevent the app from starting if the key is not set,
    # which is good for production but might be inconvenient for some dev workflows.
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")

client = openai.OpenAI(api_key=api_key)

class Question(BaseModel):
    question: str

async def stream_generator(openai_stream):
    """
    Asynchronous generator to iterate over the OpenAI stream,
    extract content from each chunk, and yield it.
    """
    try:
        for chunk in openai_stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield content
    except Exception as e:
        print(f"Error during streaming: {e}")
        # You might want to yield a special error message or handle differently
        yield f"STREAM_ERROR: An error occurred during streaming: {str(e)}"


@app.post("/api/chatbot")
async def chatbot_endpoint(request_data: Question):
    user_question = request_data.question
    if not user_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        # Call OpenAI API with stream=True
        stream = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant knowledgeable about all sports."
                },
                {
                    "role": "user",
                    "content": user_question
                }
            ],
            stream=True,
        )
        # Return a StreamingResponse using the generator
        return StreamingResponse(stream_generator(stream), media_type="text/event-stream")

    except openai.APIError as e:
        # Handle OpenAI API specific errors before the stream starts
        # These are errors like authentication issues, invalid requests before streaming begins
        print(f"OpenAI API Error before stream: {e.message}")
        raise HTTPException(status_code=e.status_code or 500, detail=f"OpenAI API Error: {e.message}")
    except Exception as e:
        # Handle other potential errors before the stream starts
        print(f"Generic Error before stream: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
