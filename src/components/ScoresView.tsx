import React, { useState, useEffect } from 'react';
import { 
  Table2, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Trash2, 
  RefreshCw, 
  Trophy, 
  Users, 
  Target, 
  Clock, 
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { PlayerScoreRecord, GameConfig } from '../types';
import { exportScoresToExcel, exportScoresToCSV } from '../utils/sheetsIntegration';
import { AudioFX } from '../utils/audio';

interface ScoresViewProps {
  gameConfig: GameConfig;
  onOpenSettings: () => void;
  onBackToBuilder?: () => void;
}

export const ScoresView: React.FC<ScoresViewProps> = ({
  gameConfig,
  onOpenSettings,
  onBackToBuilder
}) => {
  const [scores, setScores] = useState<PlayerScoreRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchScores = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        if (data.scores) {
          setScores(data.scores);
        }
      }
    } catch (err) {
      console.warn('Backend API scores fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleClearScores = async () => {
    if (!window.confirm('Are you sure you want to clear all recorded player submissions?')) return;
    try {
      await fetch('/api/scores', { method: 'DELETE' });
      setScores([]);
      AudioFX.playClick();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSampleRecord = async () => {
    AudioFX.playClick();
    const sampleNames = ['Dr. Elena Rostova', 'Marcus Brody', 'Sophia Lin', 'David Thorne', 'Amina Al-Mansoor'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomEmail = randomName.toLowerCase().replace(/[^a-z]/g, '.') + '@agency.org';

    try {
      const res = await fetch('/api/record-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: randomName,
          playerEmail: randomEmail,
          gameTitle: gameConfig.title,
          score: Math.floor(Math.random() * 300) + 100,
          accuracy: Math.floor(Math.random() * 30) + 70,
          totalTells: 3,
          foundTells: 3,
          hintsUsed: Math.floor(Math.random() * 2),
          timeElapsedSeconds: Math.floor(Math.random() * 50) + 20,
          foundDetails: [
            { title: 'Asymmetrical Eyeglass Frames', category: 'Objects / Geometry', points: 100 },
            { title: 'Extra 6th Finger on Hand', category: 'Anatomy', points: 100 }
          ]
        })
      });
      if (res.ok) {
        fetchScores();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered scores
  const filteredScores = scores.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.playerName.toLowerCase().includes(term) ||
      s.playerEmail.toLowerCase().includes(term) ||
      s.gameTitle.toLowerCase().includes(term)
    );
  });

  // Analytics
  const totalPlayers = scores.length;
  const topScore = scores.reduce((max, s) => (s.score > max ? s.score : max), 0);
  const avgAccuracy = totalPlayers > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.accuracy, 0) / totalPlayers)
    : 0;
  const avgTime = totalPlayers > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.timeElapsedSeconds, 0) / totalPlayers)
    : 0;

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#050508] overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-7xl w-full mx-auto space-y-6 z-10 relative">
        {/* Top Header & Export Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Data & Submissions Hub
              </span>
              {gameConfig.sheetsConfig?.webhookUrl ? (
                <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>Linked to Google Sheets</span>
                </span>
              ) : (
                <button
                  onClick={onOpenSettings}
                  className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Configure Google Sheets Sync &rarr;
                </button>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Player Submissions & Excel Export
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              All player names, emails, scores, and forensic accuracy logged in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onBackToBuilder && (
              <button
                onClick={() => {
                  AudioFX.playClick();
                  onBackToBuilder();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>&larr; Return to Builder</span>
              </button>
            )}

            <button
              onClick={handleAddSampleRecord}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Add a sample player record to test the table"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Entry</span>
            </button>

            <button
              onClick={() => {
                AudioFX.playClick();
                fetchScores();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors cursor-pointer"
              title="Refresh table"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                AudioFX.playClick();
                exportScoresToCSV(scores);
              }}
              disabled={scores.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white/50" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                AudioFX.playClick();
                exportScoresToExcel(scores);
              }}
              disabled={scores.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 transition-all disabled:opacity-50 border-t border-white/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Players</div>
              <div className="text-xl font-mono font-bold text-white mt-0.5">{totalPlayers}</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Top Score</div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-0.5">{topScore} PTS</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Avg Accuracy</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{avgAccuracy}%</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Avg Solve Time</div>
              <div className="text-xl font-mono font-bold text-purple-300 mt-0.5">{avgTime}s</div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Table Container */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Search bar & count */}
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-white/30" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by player name or email..."
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-white/50">
              <span>
                Showing <strong className="text-cyan-400">{filteredScores.length}</strong> of {scores.length} entries
              </span>
              {scores.length > 0 && (
                <button
                  onClick={handleClearScores}
                  className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/30 text-white/40 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-12 font-mono">#</th>
                  <th className="py-3.5 px-4">Player Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-center">Accuracy</th>
                  <th className="py-3.5 px-4 text-center">Tells Found</th>
                  <th className="py-3.5 px-4 text-right">Time</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredScores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-20 text-white/40">
                      <Table2 className="w-8 h-8 mx-auto mb-2 text-white/20" />
                      <p className="font-bold text-sm text-white/80">No Player Records Found</p>
                      <p className="text-[11px] text-white/40 mt-1 max-w-sm mx-auto">
                        Submissions will appear here when players complete the game in Playtest mode or from an exported standalone copy.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredScores.map((record, idx) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-white/40">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                          {record.playerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[160px]">{record.playerName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-white/70 font-mono text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-white/30" />
                          <span className="truncate max-w-[200px]">{record.playerEmail}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                        {record.score} PTS
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                            record.accuracy >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {record.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-white/80 text-[11px]">
                        {record.foundTells} / {record.totalTells}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-300 text-[11px]">
                        {record.timeElapsedSeconds}s
                      </td>
                      <td className="py-3.5 px-4 text-white/40 text-[11px] whitespace-nowrap font-mono">
                        {new Date(record.completedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
