"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function parseWeightFromLine(text: string): number | null {
  const cleaned = text.replace(/[^\d.,+-]/g, " ").trim();
  const match = cleaned.match(/[-+]?\d+[.,]?\d*/);
  if (!match) return null;
  const value = parseFloat(match[0].replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  if (text.toLowerCase().includes("kg") && !text.toLowerCase().includes("g")) {
    return Math.round(value * 1000);
  }
  if (value < 50 && text.toLowerCase().includes("kg")) {
    return Math.round(value * 1000);
  }
  if (value > 0 && value < 50 && !text.toLowerCase().includes("g")) {
    return Math.round(value * 1000);
  }
  return Math.round(value);
}

export type WeightScaleState = {
  weightGrams: number;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  manualMode: boolean;
  setWeightGrams: (grams: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  tare: () => void;
};

export function useWeightScale(): WeightScaleState {
  const [weightGrams, setWeightGramsState] = useState(0);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const bufferRef = useRef("");

  const disconnect = useCallback(() => {
    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;
    portRef.current?.close().catch(() => {});
    portRef.current = null;
    setConnected(false);
    setConnecting(false);
  }, []);

  const readLoop = useCallback(async (port: SerialPort) => {
    if (!port.readable) return;
    const reader = port.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        const parts = bufferRef.current.split(/\r|\n/);
        bufferRef.current = parts.pop() ?? "";
        for (const line of parts) {
          const g = parseWeightFromLine(line);
          if (g != null) setWeightGramsState(g);
        }
      }
    } catch {
      // port closed
    } finally {
      reader.releaseLock();
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      setManualMode(true);
      setError("ব্রাউজারে স্কেল সাপোর্ট নেই — নিচে ওজন লিখুন");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const port = await navigator.serial!.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setConnected(true);
      setManualMode(false);
      void readLoop(port);
    } catch (err) {
      setManualMode(true);
      setError(err instanceof Error ? err.message : "স্কেল কানেক্ট হয়নি");
    } finally {
      setConnecting(false);
    }
  }, [readLoop]);

  const setWeightGrams = useCallback((grams: number) => {
    setManualMode(true);
    setWeightGramsState(Math.max(0, Math.round(grams)));
  }, []);

  const tare = useCallback(() => {
    setWeightGramsState(0);
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    weightGrams,
    connected,
    connecting,
    error,
    manualMode,
    setWeightGrams,
    connect,
    disconnect,
    tare,
  };
}

declare global {
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
  }
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>;
    };
  }
}
