// Tiny user-agent parser → short device label like "Chrome on Mac" or
// "Safari on iPhone". Doesn't try to cover every edge case (full UA libs
// weigh 100s of KB); handles the ~95% case for our learner audience.
//
// Returns 'Unknown device' as fallback so the UI always has something to render.

const BROWSER_RULES: Array<[RegExp, string]> = [
  [/\bedg(?:e|a|ios)?\/[\d.]+/i, "Edge"],
  [/\bopr\/|opera\//i, "Opera"],
  [/\bfirefox\//i, "Firefox"],
  [/\bchrome\/[\d.]+/i, "Chrome"],          // also matches CriOS via fallback below
  [/\bcrios\//i, "Chrome"],
  [/\bfxios\//i, "Firefox"],
  [/\bversion\/[\d.]+.*\bsafari\//i, "Safari"],
  [/\bsafari\//i, "Safari"],
];

const OS_RULES: Array<[RegExp, string]> = [
  [/\biphone\b/i, "iPhone"],
  [/\bipad\b/i, "iPad"],
  [/\bipod\b/i, "iPod"],
  [/\bmac(?:intosh| os x)\b/i, "Mac"],
  [/\bwindows nt 10/i, "Windows 10/11"],
  [/\bwindows nt/i, "Windows"],
  [/\bandroid\b/i, "Android"],
  [/\bcros\b/i, "ChromeOS"],
  [/\blinux\b/i, "Linux"],
];

export function parseDeviceLabel(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  let browser = "";
  for (const [re, name] of BROWSER_RULES) {
    if (re.test(ua)) { browser = name; break; }
  }
  let os = "";
  for (const [re, name] of OS_RULES) {
    if (re.test(ua)) { os = name; break; }
  }
  if (browser && os) return `${browser} on ${os}`;
  if (browser) return browser;
  if (os) return os;
  return "Unknown device";
}
