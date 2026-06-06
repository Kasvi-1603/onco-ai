import React from "react";

export default function Lungs3DModel() {
  return (
    <div className="w-full aspect-video md:aspect-square rounded-lg overflow-hidden shadow-sm relative flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="p-4 z-10 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--navy)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Interactive 3D Anatomy
            </h3>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Primary Tumor Site: Lungs & Airways</p>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative" style={{ background: 'var(--background)' }}>
        <iframe 
          title="Inside the Lungs" 
          className="absolute inset-0 w-full h-full border-none" 
          src="https://sketchfab.com/models/ce09f4099a68467880f46e61eb9a3531/embed?autostart=1&ui_theme=light&transparent=1" 
          loading="lazy" 
          allowFullScreen 
          allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        ></iframe>
      </div>
    </div>
  );
}
