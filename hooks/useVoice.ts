import { useState, useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<any>(null);

  // Tracks whether the user WANTS to be listening.
  // This persists across the automatic restarts that Chrome triggers.
  const wantsListeningRef = useRef(false);

  const [transcript, setTranscript] = useState("");
  const [finalAccumulator, setFinalAccumulator] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn("[useVoice] SpeechRecognition not supported in this browser");
      return;
    }


    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {

      let currentFinal = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinal += result[0].transcript + " ";

        } else {
          interim += result[0].transcript;
        }
      }

      if (currentFinal) {
        setFinalAccumulator((prev) => prev + currentFinal);
      }
      setTranscript(interim);
    };

    rec.onerror = (event: any) => {
      const err = event.error;

      if (err === "no-speech") {
        // Chrome fires this after ~5s of silence. Not a real error.
        // onend will fire next — our auto-restart logic there handles it.
        return;
      }

      if (err === "aborted") {
        // User or system stopped it intentionally. Not a crash.
        return;
      }

      if (err === "not-allowed" || err === "service-not-allowed") {
        console.error("[useVoice] Microphone permission denied");
        setSupported(false);
        wantsListeningRef.current = false;
        setIsListening(false);
        return;
      }

      if (err === "network") {
        console.warn("[useVoice] Network error (potentially caused by concurrent audio streams). Resuming...");
        return;
      }

      // Any other unexpected error — stop gracefully
      console.error("[useVoice] Unexpected error:", err);
      wantsListeningRef.current = false;
      setIsListening(false);
    };

    rec.onend = () => {


      if (wantsListeningRef.current) {
        // User still wants to be listening — auto-restart after a brief pause.

        setTimeout(() => {
          try {
            rec.start();
          } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
              console.error("[useVoice] Auto-restart failed:", e);
              wantsListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
  }, []);

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current;

    if (!supported || !rec) {
      console.warn("[useVoice] Cannot toggle: not supported or not initialized");
      return;
    }

    if (wantsListeningRef.current) {
      // User wants to STOP

      wantsListeningRef.current = false;
      try {
        rec.stop();
      } catch (e) {
        console.error("[useVoice] Error stopping:", e);
      }
      setIsListening(false);
    } else {
      // User wants to START

      wantsListeningRef.current = true;
      setFinalAccumulator("");
      setTranscript("");

      // IMMEDIATELY stop TTS: if the AI is actively speaking, OS-level echo cancellation 
      // or Chrome's privacy settings often forcefully mute the Microphone.
      if (typeof window !== "undefined" && window.speechSynthesis) {
         window.speechSynthesis.cancel();
      }

      try {
        rec.start();
        setIsListening(true);
      } catch (e: any) {
        if (e.name === 'InvalidStateError') {
          // Already started, safely ignore
          setIsListening(true);
        } else {
          console.error("[useVoice] Error starting:", e);
          wantsListeningRef.current = false;
        }
      }
    }
  }, [supported]);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    supported,
    transcript: finalAccumulator + transcript,
    toggleListening,
    speakText,
    stopSpeaking,
    resetTranscript: () => {
      setFinalAccumulator("");
      setTranscript("");
    },
  };
}
