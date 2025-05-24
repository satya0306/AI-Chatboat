"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isError?: boolean;
  retryFn?: () => Promise<void>;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText: string): Promise<void> => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Network response was not ok');
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";
      const botMessageId = (Date.now() + 1).toString();

      // Add a placeholder for the bot's message
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: botMessageId, text: "", sender: 'bot' }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: accumulatedResponse } : msg
          )
        );
      }

      // Final decode
      const finalChunk = decoder.decode();
      if (finalChunk) {
        accumulatedResponse += finalChunk;
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId ? { ...msg, text: accumulatedResponse } : msg
          )
        );
      }

      if (accumulatedResponse.startsWith("STREAM_ERROR:")) {
        throw new Error(accumulatedResponse.replace("STREAM_ERROR: ", ""));
      }

    } catch (error) {
      console.error("Failed to fetch chatbot response:", error);
      const errorText = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.text === "") {
          // Update the placeholder with error and retry function
          return prevMessages.map((msg, index) =>
            index === prevMessages.length - 1 
              ? { 
                  ...msg, 
                  text: errorText, 
                  isError: true,
                  retryFn: () => sendMessage(messageText)
                } 
              : msg
          );
        } else {
          // Add new error message with retry function
          return [
            ...prevMessages,
            { 
              id: (Date.now() + 2).toString(), 
              text: errorText, 
              sender: 'bot', 
              isError: true,
              retryFn: () => sendMessage(messageText)
            }
          ];
        }
      });
      throw error; // Re-throw to be caught by handleSubmit
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      await sendMessage(currentInput);
    } catch (error) {
      // Error is handled in sendMessage
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg flex flex-col h-[calc(100vh-40px)] sm:h-[calc(100vh-80px)] md:h-[700px] lg:h-[750px]">
        <header className="bg-blue-600 text-white p-4 rounded-t-lg shadow">
          <h1 className="text-xl sm:text-2xl font-semibold text-center tracking-tight">
            AI Sports Chatbot
          </h1>
        </header>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50 custom-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">Ask me anything about sports!</p>
                <p className="text-sm">For example, "Who won the last FIFA World Cup?"</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-xl max-w-[75%] sm:max-w-[70%] break-words shadow-md transition-all duration-300 ease-in-out
                  ${msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : msg.isError ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-200 text-gray-800'
                  } ${isLoading && messages[messages.length -1].id === msg.id && msg.sender === 'bot' && msg.text === "" ? 'opacity-0 animate-pulse' : 'opacity-100'}`}
              >
                <div className="flex flex-col">
                  {isLoading && messages[messages.length -1].id === msg.id && msg.sender === 'bot' && msg.text === "" ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Bot is typing...</span>
                    </div>
                  ) : (
                    <>
                      <span>{msg.text}</span>
                      {msg.isError && msg.retryFn && (
                        <button
                          onClick={() => {
                            setIsLoading(true);
                            msg.retryFn?.().finally(() => setIsLoading(false));
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none"
                        >
                          Retry
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-lg shadow-inner">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-150"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none text-white font-semibold p-3 rounded-lg disabled:bg-blue-300 transition-colors duration-150"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
      <footer className="text-center text-gray-500 text-sm mt-4 pb-2">
        Powered by Next.js, FastAPI, and Ollama
      </footer>
    </main>
  );
}
