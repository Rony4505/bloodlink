"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function parseWeightFromLine(text: string): number | null {
  const cleaned = text.replace(/[^\d.,+-]/g, " ").trim();
  const match = cleaned.match(/[-+]?\d+[.,]?\d*/);
  if (!match) return null;
  const value = parseFloat(match[0].replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  if (text.toLowerCase().includes("g") && !text.toLowerCase().includes("kg")) {
    return value / 1000;
  }
  if (value > 50 && !text.toLowerCase().includes("kg")) return value / 1000;
  return value;
}

export type WeightScaleState = {
  weightKg: number;
  weightGrams: number;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  manualMode: boolean;
  setManualWeightKg: (kg: number) => void;
  setManualWeightGrams: (grams: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  tare: () => void;
};

export function useWeightScale(): WeightScaleState {
  const [weightKg, setWeightKg] = useState(0);
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
          const w = parseWeightFromLine(line);
          if (w != null) setWeightKg(w);
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
      setError("ব্রাউজারে স্কেল সাপোর্ট নেই — ম্যানুয়াল ওজন ব্যবহার করুন");
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

  const setManualWeightKg = useCallback((kg: number) => {
    setManualMode(true);
    setWeightKg(Math.max(0, kg));
  }, []);

  const setManualWeightGrams = useCallback((grams: number) => {
    setManualMode(true);
    setWeightKg(Math.max(0, grams) / 1000);
  }, []);

  const tare = useCallback(() => {
    setWeightKg(0);
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    weightKg,
    weightGrams: Math.round(weightKg * 1000),
    connected,
    connecting,
    error,
    manualMode,
    setManualWeightKg,
    setManualWeightGrams,
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
