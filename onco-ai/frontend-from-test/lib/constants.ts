import { MatchColor } from "./types";

export const matchColor = (score: number): MatchColor =>
  score >= 0.85 ? "green" : score >= 0.5 ? "amber" : "red";

export const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" }
] as const;
