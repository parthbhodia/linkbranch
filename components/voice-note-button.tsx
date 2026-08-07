"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import MicNoneRounded from "@mui/icons-material/MicNoneRounded";
import StopRounded from "@mui/icons-material/StopRounded";
import { Button, Tooltip } from "@mui/material";

/**
 * Dictate a note instead of typing one.
 *
 * Strictly an addition to the text field, never a replacement. Support is
 * uneven -- Chrome is solid, iOS Safari is the weak spot -- so when the API is
 * missing the button renders nothing at all and typing carries on working.
 * Nothing here uploads audio: recognition happens in the browser and only the
 * resulting text is ever handled.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Support cannot change within a session, so there is nothing to subscribe to. */
function subscribeNever() {
  return () => {};
}

export function VoiceNoteButton({
  onTranscript,
  label = "Dictate",
  size = "small",
}: {
  /** Called with each finalised chunk. Append it; do not replace. */
  onTranscript: (text: string) => void;
  label?: string;
  size?: "small" | "medium";
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const handlerRef = useRef(onTranscript);

  // Keep the latest callback without restarting recognition mid-sentence.
  useEffect(() => {
    handlerRef.current = onTranscript;
  }, [onTranscript]);

  // Whether the API exists is external, unchanging state with a different
  // answer on the server, which is exactly what useSyncExternalStore is for.
  // Rendering false on the server means the button appears on hydration
  // rather than flickering away.
  const supported = useSyncExternalStore(
    subscribeNever,
    () => Boolean(recognitionCtor()),
    () => false,
  );

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  function stop() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) chunk += result[0].transcript;
      }
      if (chunk.trim()) handlerRef.current(chunk.trim());
    };
    // A denied mic permission and a silent timeout both land here. Neither
    // deserves an error message -- the text field was always there.
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <Tooltip title={listening ? "Stop dictating" : "Dictate this note"}>
      <Button
        type="button"
        size={size}
        onClick={listening ? stop : start}
        startIcon={listening ? <StopRounded /> : <MicNoneRounded />}
        className={`voice-note${listening ? " is-listening" : ""}`}
        aria-pressed={listening}
      >
        {listening ? "Listening…" : label}
      </Button>
    </Tooltip>
  );
}
