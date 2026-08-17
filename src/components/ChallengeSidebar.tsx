import React, { useRef } from 'react';
import { 
  Images, 
  Plus, 
  Upload, 
  Trash2, 
  Target, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Challenge } from '../types';
import { createSamplePortraitSVG, createSampleStreetSVG } from '../data/defaultChallenges';
import { AudioFX } from '../utils/audio';

interface ChallengeSidebarProps {
  challenges: Challenge[];
  currentChallengeIndex: number;
  onSelectChallenge: (index: number) => void;
  onAddChallenge: (newChallenge: Challenge) => void;
  onDeleteChallenge: (index: number) => void;
  onUpdateChallengeImage: (index: number, imageUrl: string) => void;
  isOpen: boolean;
}

export const ChallengeSidebar: React.FC<ChallengeSidebarProps> = ({
  challenges,
  currentChallengeIndex,
  onSelectChallenge,
  onAddChallenge,
  onDeleteChallenge,
  onUpdateChallengeImage,
  isOpen
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        onUpdateChallengeImage(currentChallengeIndex, evt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNew = () => {
    AudioFX.playClick();
    const newChallenge: Challenge = {
      id: 'chal-' + Date.now(),
      title: `Case File #${challenges.length + 1} - Synth Scan`,
      imageUrl: challenges.length % 2 === 0 ? createSamplePortraitSVG() : createSampleStreetSVG(),
      hotspots: []
    };
    onAddChallenge(newChallenge);
  };

  return (
    <aside className="w-full md:w-80 border-r border-white/10 bg-[#0a0b12]/95 backdrop-blur-md flex flex-col shrink-0 max-h-48 md:max-h-none overflow-y-auto z-20">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
          <Images className="w-4 h-4 text-cyan-400" />
          <span>Case Challenges ({challenges.length})</span>
        </span>
        <button
          onClick={handleCreateNew}
          className="text-xs bg-white/5 hover:bg-cyan-500 hover:text-black text-white/80 hover:font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Case</span>
        </button>
      </div>

      {/* Challenge List */}
      <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
        {challenges.map((chal, idx) => {
          const isSelected = idx === currentChallengeIndex;
          return (
            <div
              key={chal.id}
              onClick={() => {
                AudioFX.playClick();
                onSelectChallenge(idx);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative group ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 relative">
                <img
                  src={chal.imageUrl}
                  alt={chal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-cyan-300' : 'text-white/90'}`}>
                  {chal.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40 font-mono">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-cyan-400" />
                    <strong className="text-white/80">{chal.hotspots.length}</strong> Tells
                  </span>
                  <span>&bull;</span>
                  <span>{chal.hotspots.reduce((acc, h) => acc + h.points, 0)} PTS</span>
                </div>
              </div>

              {challenges.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    AudioFX.playClick();
                    onDeleteChallenge(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Delete challenge"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {isSelected && (
                <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Custom Image Area */}
      <div className="p-3.5 border-t border-white/10 bg-black/30">
        <label className="border-2 border-dashed border-white/15 hover:border-cyan-400/60 rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all text-center group bg-white/5">
          <Upload className="w-5 h-5 text-white/40 group-hover:text-cyan-400 mb-1 transition-colors" />
          <span className="text-xs font-bold text-white/90">Upload Custom AI Image</span>
          <span className="text-[10px] text-white/40 mt-0.5 font-mono">PNG, JPG, WebP, SVG</span>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </aside>
  );
};
