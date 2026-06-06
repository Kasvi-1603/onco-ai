import React from "react";

interface PortalFooterProps {
  disclaimer: string;
}

export default function PortalFooter({ disclaimer }: PortalFooterProps) {
  return (
    <footer className="mt-12 pt-6 pb-8 text-center space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
      <p className="text-[10px] max-w-lg mx-auto leading-relaxed italic" style={{ color: 'var(--text-muted)' }}>
        {disclaimer}
      </p>
      <div className="text-[9px] font-mono tracking-wider font-semibold" style={{ color: 'var(--text-subtle)' }}>
        ONCOPILOT CLINICAL PATIENT PORTAL • SECURE TRANSMISSION
      </div>
    </footer>
  );
}
