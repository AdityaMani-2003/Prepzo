import { useState, useCallback, useRef } from "react";

interface StreamState {
  text: string;
  isStreaming: boolean;
  topic?: string;
  difficulty?: string;
  error: string | null;
}

export function useStreamAI() {
  const [streamState, setStreamState] = useState<StreamState>({
    text: "",
    isStreaming: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (role: string, targetCompany?: string) => {
    // Reset state before starting
    setStreamState({ text: "", isStreaming: true, error: null });
    
    // Setup cancellation token
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/stream-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, targetCompany: targetCompany || undefined }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate stream: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split("\n\n");
          
          // Keep the last incomplete fragment in the buffer
          buffer = messages.pop() || "";

          // Process complete blocks
          for (const message of messages) {
            const lines = message.split("\n");
            let dataStr = "";
            let isError = false;

            for (const line of lines) {
              if (line.startsWith("event: error")) {
                isError = true;
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice("data: ".length).trim();
              }
            }

            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.error || isError) {
                 setStreamState(prev => ({ ...prev, error: parsed.error || "Stream error" }));
              } else if (parsed.done) {
                 setStreamState(prev => ({
                    ...prev,
                    topic: parsed.topic,
                    difficulty: parsed.difficulty,
                 }));
              } else if (parsed.text) {
                setStreamState((prev) => ({
                  ...prev,
                  text: prev.text + parsed.text,
                }));
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE data block:", dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Stream intentionally cancelled by user
      } else {
        setStreamState((prev) => ({
          ...prev,
          error: prev.text.length > 0 
           ? "Connection interrupted. Partial context recovered." 
           : (err.message || "An error occurred retrieving the stream."),
        }));
      }
    } finally {
      setStreamState((prev) => ({ ...prev, isStreaming: false }));
      abortControllerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    streamState,
    startStream,
    stopStream,
  };
}
