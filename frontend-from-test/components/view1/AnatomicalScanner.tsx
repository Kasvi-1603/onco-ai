import React from "react";

export default function AnatomicalScanner() {
  return (
    <div className="relative w-full aspect-square max-w-full mx-auto rounded-lg overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      
      {/* 
        We use an img tag for the exact image provided by the user. 
        Please save your uploaded image as "human-twin.jpg" inside the "frontend/public" folder!
      */}
      <img 
        src="/human-twin.jpg" 
        alt="Human Digital Twin" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 
        Blinking Lungs Overlay 
        Positioned specifically over the chest area of this specific image.
        The image has the lungs roughly at top 25-35%, horizontally centered.
      */}
      <div className="absolute top-[28%] left-[45%] right-[45%] h-[10%] z-10 flex justify-center gap-2">
        <div className="w-1/2 h-full bg-cyan-400 rounded-full blur-md opacity-0 animate-[div-lung-pulse_4s_linear_infinite]"></div>
        <div className="w-1/2 h-full bg-cyan-400 rounded-full blur-md opacity-0 animate-[div-lung-pulse_4s_linear_infinite]"></div>
      </div>
      
      {/* Malignancy Red Blip over the right lung (left side of the image) */}
      <div className="absolute top-[30%] left-[47%] w-3 h-3 bg-red-500 rounded-full blur-[2px] opacity-0 animate-[div-lung-pulse_4s_linear_infinite]"></div>

      {/* The Scanning Line */}
      <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.7)] animate-scan z-20">
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-cyan-400/10 h-12 blur-md -mt-6"></div>
      </div>

    </div>
  );
}
