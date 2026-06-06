import React from "react";

export default function DNAHelixModel() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[360px]">
      <div className="p-4 border-b border-zinc-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0EA5A0] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0EA5A0] animate-pulse" />
          Interactive DNA Helix
        </h3>
        <p className="text-[10px] text-zinc-500 mt-1">Genomic sequence visualizer</p>
      </div>
      <div className="flex-1 relative bg-white min-h-[300px]">
        <iframe
          title="DNA Double Helix"
          className="absolute inset-0 w-full h-full border-none"
          src="https://sketchfab.com/models/a908bbcd3eb04372b83b352e71b55836/embed?autostart=1&ui_theme=light&transparent=1&preload=1"
          loading="lazy"
          allowFullScreen
          allow="autoplay; fullscreen; xr-spatial-tracking"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
