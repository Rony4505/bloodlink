"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceInput({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const part = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += part;
        } else {
          partial += part;
        }
      }
      setInterim(partial || finalText);
      if (finalText.trim()) {
        onTranscript(finalText.trim());
        setInterim("");
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || disabled) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setInterim("");
    setListening(true);
    recognition.start();
  }, [disabled, listening]);

  if (!supported) {
    return (
      <p className="rounded-xl border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
        Voice not supported in this browser — type your command below.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`jarvis-voice-btn ${listening ? "jarvis-voice-btn-active" : ""}`}
      >
        {listening ? "শুনছি… (বন্ধ করতে চাপুন)" : "🎙️ Voice command"}
      </button>
      {interim ? (
        <p className="rounded-lg bg-teal-950/50 px-3 py-2 text-sm text-teal-100/80">{interim}</p>
      ) : null}
    </div>
  );
}
