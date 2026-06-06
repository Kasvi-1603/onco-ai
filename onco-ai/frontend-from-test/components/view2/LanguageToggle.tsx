import React from "react";
import { SupportedLang } from "../../lib/types";
import { SUPPORTED_LANGS } from "../../lib/constants";

interface LanguageToggleProps {
  currentLang: SupportedLang;
  onChange: (lang: SupportedLang) => void;
  disabled?: boolean;
}

export default function LanguageToggle({ currentLang, onChange, disabled }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SUPPORTED_LANGS.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            disabled={disabled}
            onClick={() => onChange(lang.code as SupportedLang)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
              isActive
                ? "font-bold shadow-sm"
                : "hover:bg-gray-50 active:bg-gray-100"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            style={{
              background: isActive ? 'var(--navy-muted)' : 'var(--surface)',
              border: isActive ? '1px solid var(--navy-light)' : '1px solid var(--border)',
              color: isActive ? 'var(--navy)' : 'var(--text-muted)',
            }}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
