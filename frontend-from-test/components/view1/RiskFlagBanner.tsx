import React from "react";
import { RiskFlag } from "../../lib/types";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface RiskFlagBannerProps {
  flags?: RiskFlag[];
}

export default function RiskFlagBanner({ flags }: RiskFlagBannerProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="space-y-2">
      {flags.map((flag, idx) => {
        const isHigh = flag.severity === "high";
        const isMedium = flag.severity === "medium";

        const styles = isHigh
          ? { bg: 'var(--clinical-red-bg)', border: 'var(--clinical-red-border)', text: 'var(--clinical-red)', label: 'CRITICAL', Icon: AlertCircle }
          : isMedium
          ? { bg: 'var(--clinical-amber-bg)', border: 'var(--clinical-amber-border)', text: 'var(--clinical-amber)', label: 'WARNING', Icon: AlertTriangle }
          : { bg: '#f0f6ff', border: '#bfdbfe', text: '#1e40af', label: 'NOTE', Icon: Info };

        const { Icon } = styles;

        return (
          <div
            key={idx}
            className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: styles.text }} />
            <div className="flex items-start gap-2.5 flex-1 flex-wrap">
              <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded mt-0.5" style={{ background: `${styles.text}15`, color: styles.text }}>
                {styles.label}
              </span>
              <p className="text-xs leading-relaxed flex-1" style={{ color: styles.text }}>{flag.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
