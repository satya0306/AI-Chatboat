# AI Sports Chatbot

## Project Overview

This project implements an AI-powered chatbot specialized in sports-related queries. Users can ask questions about various sports, and the chatbot, leveraging the OpenAI API, will provide informative answers.

The application is built with a modern tech stack:
*   **Frontend:** Next.js (React framework) with TypeScript and Tailwind CSS for a responsive and interactive user interface.
*   **Backend:** FastAPI (Python web framework) to handle API requests and integrate with the OpenAI API.
*   **AI:** OpenAI API (specifically, the `gpt-3.5-turbo` model by default) for natural language processing and generating responses.

## Project Structure

The project is organized into two main directories:

*   `frontend/`: Contains the Next.js application. This is responsible for the user interface, capturing user input, displaying messages, and communicating with the backend.
*   `backend/`: Contains the FastAPI application. This handles incoming API requests from the frontend, processes them, interacts with the OpenAI API, and sends responses back.

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

4.  **Set up your OpenAI API Key:**
    *   **Crucial Step:** The backend needs an OpenAI API key to communicate with the OpenAI service.
    *   **Obtain an API Key:** If you don't have one, sign up at [OpenAI Platform](https://platform.openai.com/) and generate an API key from your dashboard.
    *   **Set as Environment Variable:** You must set your API key as an environment variable named `OPENAI_API_KEY`.
        *   On macOS and Linux (bash/zsh):
            ```bash
            export OPENAI_API_KEY='your_actual_openai_api_key'
            ```
        *   On Windows (Command Prompt):
            ```bash
            set OPENAI_API_KEY=your_actual_openai_api_key
            ```
        *   On Windows (PowerShell):
            ```bash
            $env:OPENAI_API_KEY='your_actual_openai_api_key'
            ```
        (Replace `'your_actual_openai_api_key'` with your actual key.)
    *   **Security Warning:** Never hardcode your API key directly in the source code or commit it to version control. Using environment variables is a more secure practice. The `.gitignore` file should ideally list any local configuration files that might accidentally contain such keys (though for this project, environment variables are the prescribed method).

5.  **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    *   The `--reload` flag enables auto-reloading during development, so the server will restart automatically when you make code changes.
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
    *   Ensure your `OPENAI_API_KEY` environment variable is set correctly in this terminal session (as described in the "Backend Setup" section).
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
3.  **Backend Processing & OpenAI Interaction (Streaming):** The FastAPI backend receives the question. It then constructs a request to the OpenAI API (using the `gpt-3.5-turbo` model by default) with `stream=True`. This includes the user's question and a system prompt ("You are a helpful assistant knowledgeable about all sports.").
4.  **OpenAI Response (Stream):** The OpenAI API processes the request and, instead of sending the full answer at once, streams back the response token by token.
5.  **Backend to Frontend (Stream):** The FastAPI backend uses a `StreamingResponse` to send these tokens as they arrive to the Next.js frontend. Each piece of the message is sent as a chunk in a text/event-stream.
6.  **Display Answer (Streaming):** The frontend receives these chunks progressively. As each chunk arrives, it's decoded and appended to the current bot message being displayed in the chat interface. This creates the effect of the bot "typing out" its answer in real-time. Error handling is in place for issues during this process.

## Customization & Further Development

This project serves as a solid foundation. Here are some ideas for customization and further development:

*   **AI Model:** Experiment with different OpenAI models (e.g., newer versions of GPT-3.5 or GPT-4 if you have access and budget) by changing the `model` parameter in `backend/main.py`.
*   **System Prompt:** Modify the system prompt in `backend/main.py` to change the chatbot's persona, expertise, or response style. For example, you could make it specialize in a single sport or adopt a more humorous tone.
*   **Styling & UI/UX:** Further enhance the user interface by customizing Tailwind CSS styles in `frontend/src/app/page.tsx` and `frontend/src/app/globals.css`. You could add features like user avatars, message timestamps, or theming options.
*   **Sports Knowledge Base Enhancement:** For more specialized or real-time sports data, you could integrate external sports APIs (e.g., for live scores, player statistics, match schedules) into the backend. The chatbot could then be programmed to query these APIs based on user questions to provide more dynamic and accurate information.
*   **Streaming Responses:** The application now implements streaming responses for a more interactive "typing" effect. This can be further refined, for instance, by adding more sophisticated error handling for broken streams or by allowing users to interrupt a long stream.
*   **Conversation History:** Currently, each query is treated as independent. You could extend the application to maintain conversation history, allowing for follow-up questions and more context-aware responses. This would involve changes in both frontend state management and how requests are sent to the OpenAI API (passing previous messages).
*   **User Authentication:** If you want to personalize the experience or manage usage, consider adding user authentication.
*   **Deployment:** Prepare the application for deployment to cloud platforms. Some common choices include:
    *   **Frontend (Next.js):** Vercel (highly recommended for Next.js), Netlify, AWS Amplify.
    *   **Backend (FastAPI):** Heroku, AWS Elastic Beanstalk, Google Cloud Run, DigitalOcean App Platform.
    *   Remember to configure environment variables (like `OPENAI_API_KEY`) in your deployment environment.

---

We hope you find this AI Sports Chatbot a useful starting point for your own projects!