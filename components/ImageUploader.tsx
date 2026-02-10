
import React, { useState } from 'react';
import { Upload, Play, Image as ImageIcon, X, Trash2, AlertCircle, Github, Mail } from 'lucide-react';
import { MemoryImage } from '../types';

interface Props {
  onStart: (images: MemoryImage[]) => void;
}

const IMAGE_LIMIT = 100;

const ImageUploader: React.FC<Props> = ({ onStart }) => {
  const [previews, setPreviews] = useState<MemoryImage[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: MemoryImage[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newImages.push({ id: Math.random().toString(36).substr(2, 9), url });
    });

    setPreviews((prev) => [...prev, ...newImages].slice(0, IMAGE_LIMIT));
  };

  const removeImage = (id: string) => {
    setPreviews(previews.filter(p => p.id !== id));
  };

  const clearAll = () => {
    setPreviews([]);
  };

  const addPlaceholders = () => {
    const remaining = IMAGE_LIMIT - previews.length;
    if (remaining <= 0) return;
    
    const count = Math.min(20, remaining);
    const placeholders: MemoryImage[] = Array.from({ length: count }).map((_, i) => ({
      id: `placeholder-${Date.now()}-${i}`,
      url: `https://picsum.photos/seed/${Math.random()}/400/400`
    }));
    setPreviews([...previews, ...placeholders]);
  };

  const isLimitReached = previews.length >= IMAGE_LIMIT;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 md:py-12 px-4 md:px-6 text-white bg-zinc-950 font-sans selection:bg-cyan-500/30">
      <div className="max-w-5xl w-full text-center space-y-6 md:space-y-8 flex-grow">
        <div className="space-y-2 md:space-y-3 px-2">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent uppercase">
            Memory Globe
          </h1>
          <p className="text-zinc-500 text-[10px] sm:text-xs md:text-sm tracking-[0.2em] md:tracking-[0.4em] uppercase font-light">
            Neural Experience Architect
          </p>
        </div>

        <div className="relative group w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 px-2">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] md:text-xs font-mono px-3 py-1 rounded-full border ${isLimitReached ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-zinc-800 text-zinc-400 bg-zinc-900'}`}>
                CAPACITY: {previews.length} / {IMAGE_LIMIT}
              </span>
              {isLimitReached && (
                <span className="flex items-center gap-1 text-red-500 text-[9px] md:text-[10px] font-bold animate-pulse uppercase tracking-wider">
                  <AlertCircle size={12} /> Limit Reached
                </span>
              )}
            </div>
            
            {previews.length > 0 && (
              <button 
                onClick={clearAll}
                className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-[9px] md:text-[10px] uppercase tracking-widest transition-colors font-bold"
              >
                <Trash2 size={14} /> Clear Vault
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3 max-h-[350px] md:max-h-[480px] overflow-y-auto p-4 md:p-6 rounded-2xl md:rounded-3xl bg-zinc-900/30 border border-white/5 backdrop-blur-3xl custom-scrollbar shadow-inner">
            {previews.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-lg md:rounded-xl overflow-hidden border border-white/10 bg-zinc-800 transition-transform hover:scale-105 hover:z-10 shadow-lg">
                <img src={img.url} className="w-full h-full object-cover" alt="Memory" loading="lazy" />
                <button 
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-1 md:p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-md md:rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {!isLimitReached && (
              <label className="flex flex-col items-center justify-center aspect-square rounded-lg md:rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group/label">
                <Upload className="text-zinc-600 group-hover/label:text-cyan-400 transition-colors" size={20} />
                <span className="text-[8px] md:text-[10px] text-zinc-600 mt-1 md:mt-2 font-bold uppercase tracking-tighter group-hover/label:text-cyan-400">Add</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center w-full max-w-md mx-auto sm:max-w-none px-4">
          <button 
            disabled={isLimitReached}
            onClick={addPlaceholders}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-all font-bold border border-white/5 disabled:opacity-30 uppercase text-[10px] md:text-xs tracking-widest active:scale-95"
          >
            <ImageIcon size={16} />
            Auto-Populate
          </button>
          
          <button 
            disabled={previews.length === 0}
            onClick={() => onStart(previews)}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-12 py-4 md:py-5 rounded-full bg-white hover:bg-cyan-50 text-black transition-all font-black disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(255,255,255,0.05)] uppercase text-xs md:text-sm tracking-[0.2em] group active:scale-95"
          >
            <Play size={18} className="fill-black group-hover:scale-110 transition-transform" />
            Initialize Matrix
          </button>
        </div>

        <div className="pt-6 md:pt-8 border-t border-white/5 px-2">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-40">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase whitespace-nowrap">Navigation</span>
              <span className="text-[7px] md:text-[9px] text-zinc-400 uppercase tracking-tighter sm:tracking-normal">Right Hand Pinch to Rotate</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase whitespace-nowrap">Depth Control</span>
              <span className="text-[7px] md:text-[9px] text-zinc-400 uppercase tracking-tighter sm:tracking-normal">Left Hand Pinch to Zoom</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase whitespace-nowrap">Flow Control</span>
              <span className="text-[7px] md:text-[9px] text-zinc-400 uppercase tracking-tighter sm:tracking-normal">Open Hand to Speed Up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Credits */}
      <footer className="mt-12 pt-8 border-t border-white/5 w-full max-w-5xl flex flex-col items-center gap-4 text-center">
        <p className="text-zinc-500 font-mono text-[9px] md:text-[11px] tracking-[0.3em] uppercase">
          Created by <span className="text-cyan-400 font-bold">Trisha Sharma</span>
        </p>
        <div className="flex items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
          <a href="https://github.com/us107" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
            <Github size={14} className="group-hover:text-cyan-400 transition-colors" />
            <span className="font-mono text-[9px] uppercase tracking-widest group-hover:text-cyan-400 transition-colors">us107</span>
          </a>
          <a href="mailto:trish2582@gmail.com" className="flex items-center gap-2 group">
            <Mail size={14} className="group-hover:text-cyan-400 transition-colors" />
            <span className="font-mono text-[9px] uppercase tracking-widest group-hover:text-cyan-400 transition-colors">trish2582@gmail.com</span>
          </a>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ImageUploader;
