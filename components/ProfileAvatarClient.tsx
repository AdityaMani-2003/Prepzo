"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";

export function ProfileAvatarClient({ initialLetter, defaultImage }: { initialLetter: string, defaultImage?: string }) {
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     setLoading(true);
     // Instantly show the local preview
     const url = URL.createObjectURL(file);
     
     // Simulate server interaction delay for UX feedback
     setTimeout(() => {
        setImageUrl(url);
        setLoading(false);
     }, 800);
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()} title="Change Profile Picture">
       <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
       
       <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[24px] font-bold text-white shrink-0 shadow-inner overflow-hidden border-2 border-[var(--bg-card)] group-hover:border-indigo-400 transition-all relative">
          
          {imageUrl ? (
            <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            initialLetter
          )}
          
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
          </div>
       </div>
    </div>
  );
}
