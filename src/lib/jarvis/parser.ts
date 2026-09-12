import type { CommandIntent, ParsedCommand } from "./types";

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

export function parseCommandText(raw: string): ParsedCommand {
  const text = raw.trim().toLowerCase();

  if (!text) {
    return { intent: "unknown", targetKind: "laptop" };
  }

  if (includesAny(text, ["ping", "test", "hello", "হ্যালো", "টেস্ট"])) {
    return { intent: "ping", targetKind: "laptop" };
  }

  const cameraPhrases = [
    "camera",
    "webcam",
    "photo",
    "picture",
    "selfie",
    "capture",
    "snap",
    "ক্যামেরা",
    "ছবি",
    "তুল",
    "তোল",
    "ফটো",
  ];
  if (includesAny(text, cameraPhrases)) {
    return { intent: "camera_capture", targetKind: "laptop" };
  }

  const screenshotPhrases = ["screenshot", "screen shot", "স্ক্রিনশট", "স্ক্রিন"];
  if (includesAny(text, screenshotPhrases)) {
    return { intent: "screenshot", targetKind: "laptop" };
  }

  if (includesAny(text, ["mute", "silent", "মিউট", "নিঃশব্দ"])) {
    return { intent: "volume_mute", targetKind: "laptop" };
  }

  if (includesAny(text, ["volume up", "sound up", "ভলিউম বাড়", "আওয়াজ বাড়"])) {
    return { intent: "volume_up", targetKind: "laptop" };
  }

  if (includesAny(text, ["volume down", "sound down", "ভলিউম কম", "আওয়াজ কম"])) {
    return { intent: "volume_down", targetKind: "laptop" };
  }

  const openMatch =
    text.match(/(?:open|launch|start|start koro|kholo|খোল|চালু)\s+(.+)/i) ??
    text.match(/(.+?)\s+(?:open|kholo|খোল)/i);
  if (openMatch?.[1]) {
    return {
      intent: "open_app",
      targetKind: "laptop",
      appName: openMatch[1].trim(),
    };
  }

  return { intent: "unknown", targetKind: "laptop" };
}

export function intentLabel(intent: CommandIntent): { en: string; bn: string } {
  switch (intent) {
    case "camera_capture":
      return { en: "Capture photo from laptop camera", bn: "ল্যাপটপ ক্যামেরা থেকে ছবি তুলুন" };
    case "screenshot":
      return { en: "Take a screenshot", bn: "স্ক্রিনশট নিন" };
    case "open_app":
      return { en: "Open application", bn: "অ্যাপ খুলুন" };
    case "volume_mute":
      return { en: "Mute volume", bn: "ভলিউম মিউট করুন" };
    case "volume_up":
      return { en: "Increase volume", bn: "ভলিউম বাড়ান" };
    case "volume_down":
      return { en: "Decrease volume", bn: "ভলিউম কমান" };
    case "ping":
      return { en: "Ping agent", bn: "এজেন্ট টেস্ট" };
    default:
      return { en: "Unknown command", bn: "অজানা কমান্ড" };
  }
}
