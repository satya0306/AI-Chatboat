# AI Sports Chatbot

## Project Overview

This project implements an AI-powered chatbot specialized in sports-related queries. Users can ask questions about various sports, and the chatbot, leveraging a large language model (LLM) via Ollama or OpenAI, will provide informative answers.

The application is built with a modern tech stack:
*   **Frontend:** Next.js (React framework) with TypeScript and Tailwind CSS for a responsive and interactive user interface.
*   **Backend:** FastAPI (Python web framework) to handle API requests and integrate with the chosen LLM backend.
*   **AI:**
    *   **Default:** Ollama with a local model (e.g., `llama2`). This allows for local, offline inference.
    *   **Alternative (previous version):** OpenAI API (specifically, the `gpt-3.5-turbo` model). The codebase can be adapted to switch between these.

## Project Structure

The project is organized into two main directories:

*   `frontend/`: Contains the Next.js application. This is responsible for the user interface, capturing user input, displaying messages, and communicating with the backend.
*   `backend/`: Contains the FastAPI application. This handles incoming API requests from the frontend, processes them, interacts with the configured LLM (Ollama by default), and sends responses back.

During development, the Next.js frontend (typically running on `http://localhost:3000`) uses a proxy to forward API requests from `/api/chatbot` to the FastAPI backend (typically running on `http://127.0.0.1:8000`). This simplifies development by avoiding CORS issues.

## Backend Setup

To set up and run the backend server, follow these steps:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    *   It's highly recommended to use a virtual environment to manage project dependencies.
    ```bash
    python -m venv venv
    ```
    *   Activate the environment:
        *   On macOS and Linux:
            ```bash
            source venv/bin/activate
            ```
        *   On Windows (Command Prompt/PowerShell):
            ```bash
            venv\\Scripts\\activate
            ```

3.  **Install dependencies:**
    *   Ensure your virtual environment is active before running this command.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your LLM Backend (Ollama):**
    *   **Install Ollama:** Download and install Ollama from [ollama.com](https://ollama.com/). Follow the instructions for your operating system.
    *   **Pull a Model:** Once Ollama is installed and running, pull a model. The default for this project is `llama2`. Open a terminal and run:
        ```bash
        ollama pull llama2
        ```
        You can choose other models from the [Ollama Library](https://ollama.com/library) (e.g., `ollama pull mistral`). If you use a different model, set the `OLLAMA_MODEL` environment variable (see step 5).
    *   **Ensure Ollama is Running:** The Ollama application or service must be running for the backend to connect to it. By default, it runs on `http://localhost:11434`.

5.  **Configure Environment Variables (Optional for Ollama):**
    *   `OLLAMA_MODEL`: If you want to use a model other than the default (`llama2`), set this environment variable. For example:
        ```bash
        export OLLAMA_MODEL='mistral' 
        ```
        (Use appropriate command for your OS to set environment variables).
    *   `OLLAMA_API_URL`: If your Ollama service is running on a different URL, set this variable. Defaults to `http://localhost:11434/api/chat`.

6.  **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    *   The `--reload` flag enables auto-reloading during development.
    *   The server will typically be available at `http://127.0.0.1:8000`.

## Frontend Setup

To set up and run the frontend Next.js application, follow these steps:

1.  **Prerequisites:**
    *   **Node.js:** Ensure you have Node.js installed. The Long-Term Support (LTS) version is recommended. You can download it from [nodejs.org](https://nodejs.org/). Installing Node.js will also install npm (Node Package Manager), which is used to manage project dependencies.

2.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    *   This command reads the `package.json` file and installs all the necessary libraries for the frontend application.
    ```bash
    npm install
    ```
    (If you prefer Yarn, and have it installed, you can use `yarn install`.)

4.  **Run the Next.js development server:**
    ```bash
    npm run dev
    ```
    (Or `yarn dev` if using Yarn.)
    *   This command starts the Next.js development server, which typically includes features like Hot Module Replacement (HMR) for a smooth development experience.
    *   The application will usually be available at `http://localhost:3000`.

## Running the Full Application

To use the AI Sports Chatbot, both the backend and frontend servers must be running concurrently. This setup allows the frontend to communicate with the backend.

1.  **Start the Backend Server:**
    *   Open a terminal window (or tab).
    *   Navigate to your project's `backend` directory (e.g., `cd path/to/your_project/backend`).
    *   Activate the Python virtual environment you created earlier (e.g., `source venv/bin/activate` on macOS/Linux, or `venv\\Scripts\\activate` on Windows).
    *   Ensure your Ollama service is running (see "Backend Setup" step 4).
    *   If you are using a custom Ollama model or URL, ensure the `OLLAMA_MODEL` or `OLLAMA_API_URL` environment variables are set in this terminal session.
    *   Run the backend server:
        ```bash
        uvicorn main:app --reload
        ```
    *   Keep this terminal window open and the server running. The backend will typically be active on `http://127.0.0.1:8000`. You should see log output indicating the server has started.

2.  **Start the Frontend Server:**
    *   Open a *new, separate* terminal window (or tab). Do not close or stop the backend server.
    *   Navigate to your project's `frontend` directory (e.g., `cd path/to/your_project/frontend`).
    *   If you haven't installed dependencies yet (or if they've changed), run `npm install`.
    *   Run the frontend development server:
        ```bash
        npm run dev
        ```
    *   Keep this terminal window open and the server running. The frontend will typically be active on `http://localhost:3000`. Your browser might open automatically, or you'll see a message indicating where to access it.

3.  **Access the Application:**
    *   Open your web browser (if it didn't open automatically).
    *   Navigate to `http://localhost:3000`.
    *   You should now see the AI Sports Chatbot interface. You can type your sports-related questions into the input field and press Enter or click the "Send" button. The frontend will make requests to the backend (which are proxied by Next.js during development).

## How it Works

The application follows this flow for each user query:

1.  **User Input:** The user types a message into the chat interface on the Next.js frontend and submits it.
2.  **Frontend to Backend:** The frontend application sends the user's message as a JSON payload (e.g., `{"question": "Who won the last World Cup?"}`) to its own `/api/chatbot` endpoint. Due to the proxy configuration in `frontend/next.config.mjs`, this request is transparently forwarded during development to the FastAPI backend at `http://127.0.0.1:8000/api/chatbot`.
3.  **Backend Processing & Ollama Interaction (Streaming):** The FastAPI backend receives the question. It then constructs a request to the local Ollama API (using the model specified by `OLLAMA_MODEL`, defaulting to `llama2`) with `stream=True`. This includes the user's question and a system prompt ("You are a helpful assistant knowledgeable about all sports.").
4.  **Ollama Response (Stream):** The Ollama API processes the request with the local LLM and, instead of sending the full answer at once, streams back the response. Each part of the response is a JSON object containing a piece of the generated text.
5.  **Backend to Frontend (Stream):** The FastAPI backend uses a `StreamingResponse` to send these text pieces as they are extracted from the Ollama stream to the Next.js frontend. Each piece of the message is sent as a chunk in a text/event-stream.
6.  **Display Answer (Streaming):** The frontend receives these chunks progressively. As each chunk arrives, it's decoded and appended to the current bot message being displayed in the chat interface. This creates the effect of the bot "typing out" its answer in real-time. Error handling is in place for issues during this process.

## Customization & Further Development

This project serves as a solid foundation. Here are some ideas for customization and further development:

*   **AI Model (Ollama):**
    *   Experiment with different models available in Ollama by setting the `OLLAMA_MODEL` environment variable (e.g., `mistral`, `codellama`). Ensure you pull the model first (`ollama pull <model_name>`).
    *   You can also explore fine-tuning models with Ollama if you have specific datasets.
*   **Alternative LLM Backends:** Modify `backend/main.py` to switch back to OpenAI or integrate other LLM APIs. This could be done with conditional logic based on environment variables.
*   **System Prompt:** Modify the system prompt in `backend/main.py` to change the chatbot's persona, expertise, or response style.
*   **Styling & UI/UX:** Further enhance the user interface by customizing Tailwind CSS styles in `frontend/src/app/page.tsx` and `frontend/src/app/globals.css`.
*   **Sports Knowledge Base Enhancement:** For more specialized or real-time sports data, integrate external sports APIs into the backend.
*   **Streaming Responses:** The application implements streaming. This can be further refined, for instance, by adding more sophisticated error handling for broken streams or by allowing users to interrupt a long stream.
*   **Conversation History:** Currently, each query is treated as independent. Extend the application to maintain conversation history.
*   **User Authentication:** Consider adding user authentication for personalized experiences.
*   **Deployment:**
    *   **Frontend (Next.js):** Vercel, Netlify, AWS Amplify.
    *   **Backend (FastAPI with Ollama):** Deploying a FastAPI app that relies on a local Ollama instance requires a different approach than a typical stateless backend. You'd need a server where you can run both your FastAPI app and the Ollama service with its models. Consider Docker for packaging both.
    *   Remember to configure environment variables in your deployment environment.

---

We hope you find this AI Sports Chatbot a useful starting point for your own projects!