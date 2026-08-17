import React from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  Table2, 
  Sliders, 
  FileSpreadsheet, 
  Download,
  Share2
} from 'lucide-react';
import { ActiveView, GameConfig } from '../types';
import { AudioFX } from '../utils/audio';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  gameConfig: GameConfig;
  onOpenSettings: () => void;
  onExportHTML: () => void;
  recordedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  gameConfig,
  onOpenSettings,
  onExportHTML,
  recordedCount
}) => {
  return (
    <header className="h-16 md:h-18 border-b border-white/10 bg-black/60 backdrop-blur-md px-3 sm:px-6 md:px-8 flex items-center justify-between z-30 shrink-0 gap-2">
      {/* Brand & Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
        <button
          onClick={() => {
            AudioFX.playClick();
            setActiveView('builder');
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform cursor-pointer"
          title="Go to Builder"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-black text-sm sm:text-base leading-tight tracking-tight italic flex items-center gap-1.5 text-white">
            <span className="hidden xs:inline">AI TELL STUDIO</span>
            <span className="xs:hidden">STUDIO</span>
            <span className="text-[9px] sm:text-[10px] not-italic bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
              PRO
            </span>
          </h1>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-white/50 hidden md:flex">
            <span className="truncate max-w-[140px] lg:max-w-xs">{gameConfig.title}</span>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">
                {gameConfig.sheetsConfig?.webhookUrl ? 'Sheets Sync: Active' : 'Excel Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Nav Views - Always Prominent */}
      <nav className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner shrink-0">
        <button
          id="nav-tab-builder"
          onClick={() => {
            AudioFX.playClick();
            setActiveView('builder');
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeView === 'builder'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-extrabold tracking-wide">Builder</span>
        </button>

        <button
          id="nav-tab-playtest"
          onClick={() => {
            AudioFX.playClick();
            setActiveView('playtest');
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
            activeView === 'playtest'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Playtest Mode</span>
          <span className="sm:hidden">Play</span>
        </button>

        <button
          id="nav-tab-scores"
          onClick={() => {
            AudioFX.playClick();
            setActiveView('scores');
          }}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all relative cursor-pointer ${
            activeView === 'scores'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scores & Excel</span>
          <span className="sm:hidden">Scores</span>
          {recordedCount > 0 && (
            <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
              activeView === 'scores' ? 'bg-black/60 text-cyan-300 border border-cyan-400/40' : 'bg-cyan-400 text-black'
            }`}>
              {recordedCount}
            </span>
          )}
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            AudioFX.playClick();
            onOpenSettings();
          }}
          className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
          title="Game & Google Sheets Integration Settings"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Sheets Setup</span>
        </button>

        <button
          onClick={() => {
            AudioFX.playClick();
            onExportHTML();
          }}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-3 sm:px-4 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] border-t border-white/20 flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          title="Export Standalone HTML Package"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export HTML</span>
          <span className="md:hidden">Export</span>
        </button>
      </div>
    </header>
  );
};
