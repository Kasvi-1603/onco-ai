import React from "react";

export default function Lungs3DModel() {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-sm relative flex flex-col border border-zinc-200 bg-white min-h-[320px]">
      <div className="p-4 z-10 border-b border-zinc-200 shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[#0EA5A0]">
          <span className="w-2 h-2 rounded-full bg-[#0EA5A0] animate-pulse" />
          Interactive 3D Anatomy
        </h3>
        <p className="text-[10px] mt-1 text-zinc-500">Primary Tumor Site: Lungs & Airways</p>
      </div>
      <div className="flex-1 w-full relative bg-white min-h-[280px]">
        <iframe 
          title="Inside the Lungs" 
          className="absolute inset-0 w-full h-full border-none" 
          src="https://sketchfab.com/models/ce09f4099a68467880f46e61eb9a3531/embed?autostart=1&ui_theme=light&transparent=1" 
          loading="lazy" 
          allowFullScreen 
          allow="autoplay; fullscreen; xr-spatial-tracking"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
      </div>
    </div>
  );
}
