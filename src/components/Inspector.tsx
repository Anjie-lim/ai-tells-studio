import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Trash2, 
  Crosshair, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Hotspot } from '../types';
import { AudioFX } from '../utils/audio';

interface InspectorProps {
  hotspot: Hotspot | null;
  hotspotIndex: number;
  onUpdateHotspot: (updated: Partial<Hotspot>) => void;
  onDeleteHotspot: (id: string) => void;
  onDeselect: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  hotspot,
  hotspotIndex,
  onUpdateHotspot,
  onDeleteHotspot,
  onDeselect
}) => {
  const [testInput, setTestInput] = useState('');

  if (!hotspot) {
    return (
      <aside className="w-full md:w-96 border-l border-white/10 bg-[#0a0b12]/95 backdrop-blur-md flex flex-col shrink-0 overflow-y-auto z-20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-white/50 flex items-center justify-center text-xs font-bold font-mono">
              #
            </span>
            <h2 className="font-bold text-xs uppercase tracking-wider text-white/60">Tell Inspector</h2>
          </div>
        </div>

        <div className="p-6 text-center py-20 text-white/40 space-y-3 flex-1 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Crosshair className="w-6 h-6 animate-pulse text-cyan-400" />
          </div>
          <p className="font-bold text-sm text-white/80">No Hotspot Selected</p>
          <p className="text-xs text-white/50 max-w-xs leading-relaxed">
            Click anywhere on the image canvas to create a new AI artifact tell, or click an existing numbered pin to modify its parameters.
          </p>
        </div>
      </aside>
    );
  }

  const handleKeywordsChange = (val: string) => {
    const arr = val
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    onUpdateHotspot({ keywords: arr });
  };

  const isTestMatched = testInput.trim()
    ? hotspot.keywords.some((kw) => testInput.toLowerCase().includes(kw.toLowerCase()))
    : null;

  return (
    <aside className="w-full md:w-96 border-l border-white/10 bg-[#0a0b12]/95 backdrop-blur-md flex flex-col shrink-0 overflow-y-auto z-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-black font-mono">
            {hotspotIndex}
          </span>
          <h2 className="font-bold text-sm text-white truncate max-w-[200px]">
            {hotspot.title}
          </h2>
        </div>
        <button
          onClick={onDeselect}
          className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title="Deselect"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Properties Form */}
      <div className="p-4 space-y-4 text-xs flex-1">
        {/* Title */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
            Tell Name / Title
          </label>
          <input
            type="text"
            value={hotspot.title}
            onChange={(e) => onUpdateHotspot({ title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-400 outline-none text-xs"
            placeholder="e.g. Extra 6th Finger"
          />
        </div>

        {/* Category & Points */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
              Error Category
            </label>
            <select
              value={hotspot.category}
              onChange={(e) => onUpdateHotspot({ category: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2.5 text-white focus:border-cyan-400 outline-none text-xs"
            >
              <option value="Anatomy" className="bg-[#0c0d16] text-white">Anatomy</option>
              <option value="Objects / Geometry" className="bg-[#0c0d16] text-white">Objects / Geometry</option>
              <option value="Text Rendering" className="bg-[#0c0d16] text-white">Text Rendering</option>
              <option value="Lighting & Shadow" className="bg-[#0c0d16] text-white">Lighting & Shadow</option>
              <option value="Physics & Anatomy" className="bg-[#0c0d16] text-white">Physics & Anatomy</option>
              <option value="Background Artifact" className="bg-[#0c0d16] text-white">Background Artifact</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
              Score Value (PTS)
            </label>
            <input
              type="number"
              min="10"
              step="10"
              value={hotspot.points}
              onChange={(e) => onUpdateHotspot({ points: Number(e.target.value) || 100 })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-cyan-400 outline-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Hit Radius */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400">
              Hit Area Radius
            </label>
            <span className="font-mono text-cyan-400 text-[10px] font-bold">{hotspot.radius}%</span>
          </div>
          <input
            type="range"
            min="4"
            max="25"
            value={hotspot.radius}
            onChange={(e) => onUpdateHotspot({ radius: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Target Keywords */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" />
              <span>Target Solution Keywords</span>
            </label>
            <span className="text-[10px] text-white/40 font-mono">Comma separated</span>
          </div>

          <input
            type="text"
            value={hotspot.keywords.join(', ')}
            onChange={(e) => handleKeywordsChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-white outline-none font-mono text-xs"
            placeholder="e.g. finger, hand, 6, six, extra"
          />

          <p className="text-[10px] text-white/50 leading-relaxed">
            If the player’s response contains any of these keywords, the audit is accepted as correct.
          </p>

          {/* Test keyword matching live */}
          <div className="pt-2.5 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Test Player Phrase:</span>
              {testInput && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                  isTestMatched ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isTestMatched ? (
                    <><CheckCircle2 className="w-3 h-3" /> MATCHED</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> NO MATCH</>
                  )}
                </span>
              )}
            </div>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-[11px] outline-none placeholder-white/30"
              placeholder="Type sample answer here to test..."
            />
          </div>
        </div>

        {/* Player Hint */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
            Player Clue / Hint Text
          </label>
          <input
            type="text"
            value={hotspot.hint || ''}
            onChange={(e) => onUpdateHotspot({ hint: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-cyan-400 outline-none text-xs"
            placeholder="e.g. Count the digits on the hand..."
          />
        </div>

        {/* Post-Solve Explanation */}
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
            Forensic Explanation (Post-Solve)
          </label>
          <textarea
            rows={2}
            value={hotspot.explanation || ''}
            onChange={(e) => onUpdateHotspot({ explanation: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none resize-none text-xs"
            placeholder="Why this artifact occurs in AI diffusion generation..."
          />
        </div>

        {/* Delete Hotspot */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              AudioFX.playClick();
              onDeleteHotspot(hotspot.id);
            }}
            className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Hotspot</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
