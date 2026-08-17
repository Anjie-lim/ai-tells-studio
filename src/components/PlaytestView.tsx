import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  Crosshair, 
  Star, 
  Clock, 
  Lightbulb, 
  RotateCcw, 
  Check, 
  X, 
  FileSpreadsheet, 
  CloudUpload, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  ListCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameConfig, Hotspot, PlayerInfo } from '../types';
import { AudioFX } from '../utils/audio';
import { submitScoreToIntegrations, exportScoresToExcel, exportScoresToCSV } from '../utils/sheetsIntegration';

interface PlaytestViewProps {
  gameConfig: GameConfig;
  onRecordCompleted?: () => void;
  onBackToBuilder: () => void;
}

export const PlaytestView: React.FC<PlaytestViewProps> = ({
  gameConfig,
  onRecordCompleted,
  onBackToBuilder
}) => {
  // Player state
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [entryError, setEntryError] = useState('');

  // Game state
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [foundHotspotIds, setFoundHotspotIds] = useState<{ [challengeIndex: number]: string[] }>({});
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(gameConfig.timeLimit || 0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  // Active guess modal
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [guessFeedback, setGuessFeedback] = useState<{ type: 'error' | 'hint'; msg: string } | null>(null);

  // Sheets upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'fallback'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Viewport zoom
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentChallenge = gameConfig.challenges[currentChallengeIndex] || gameConfig.challenges[0];
  const currentFoundList = foundHotspotIds[currentChallengeIndex] || [];

  // Reset game on init
  const handleStartGame = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameConfig.requirePlayerEntry) {
      if (!nameInput.trim() || !emailInput.trim()) {
        setEntryError('Please enter both your name and a valid email address.');
        return;
      }
      setPlayer({ name: nameInput.trim(), email: emailInput.trim() });
    } else {
      setPlayer({ name: 'Detective Auditor', email: 'auditor@example.com' });
    }

    setFoundHotspotIds({});
    setScore(0);
    setHintsUsed(0);
    setCurrentChallengeIndex(0);
    setIsCompleted(false);
    setUploadStatus('idle');
    setGameStartTime(Date.now());
    setTimerSeconds(gameConfig.timeLimit || 0);
    AudioFX.playClick();
  };

  // Timer interval
  useEffect(() => {
    if (!player || isCompleted) return;

    if (gameConfig.timeLimit <= 0) {
      // Unlimited timer
      const interval = setInterval(() => {
        if (gameStartTime) {
          setTimeElapsed(Math.round((Date.now() - gameStartTime) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishGame();
          return 0;
        }
        return prev - 1;
      });
      if (gameStartTime) {
        setTimeElapsed(Math.round((Date.now() - gameStartTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, isCompleted, gameConfig.timeLimit, gameStartTime]);

  // Handle canvas click to find hotspot
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isCompleted || !imageRef.current || !currentChallenge) return;
    const rect = imageRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (px < 0 || px > rect.width || py < 0 || py > rect.height) return;

    let hit: Hotspot | null = null;
    for (const hs of currentChallenge.hotspots) {
      if (currentFoundList.includes(hs.id)) continue;
      const hx = (hs.x / 100) * rect.width;
      const hy = (hs.y / 100) * rect.height;
      const hr = (hs.radius / 100) * rect.width;
      const dist = Math.sqrt(Math.pow(px - hx, 2) + Math.pow(py - hy, 2));
      if (dist <= hr) {
        hit = hs;
        break;
      }
    }

    if (hit) {
      AudioFX.playClick();
      setActiveHotspot(hit);
      setGuessInput('');
      setGuessFeedback(null);
    } else {
      AudioFX.playError();
    }
  };

  // Submit guess for current hotspot
  const handleSubmitGuess = () => {
    if (!activeHotspot) return;
    const input = guessInput.trim().toLowerCase();
    if (!input) {
      setGuessFeedback({ type: 'error', msg: 'Please provide a description of the artifact.' });
      return;
    }

    const isMatch = activeHotspot.keywords.some((kw) => input.includes(kw.toLowerCase()));

    if (isMatch) {
      AudioFX.playSuccess();
      const updatedList = [...currentFoundList, activeHotspot.id];
      const nextFoundMap = { ...foundHotspotIds, [currentChallengeIndex]: updatedList };
      setFoundHotspotIds(nextFoundMap);
      setScore((prev) => prev + activeHotspot.points);
      setActiveHotspot(null);

      // Check if all challenges & hotspots completed
      let totalCount = 0;
      let totalFound = 0;
      gameConfig.challenges.forEach((c, idx) => {
        totalCount += c.hotspots.length;
        totalFound += (nextFoundMap[idx] || []).length;
      });

      if (totalFound >= totalCount) {
        setTimeout(() => handleFinishGame(nextFoundMap), 400);
      }
    } else {
      AudioFX.playError();
      setGuessFeedback({
        type: 'hint',
        msg: `Incorrect keywords. Clue: ${activeHotspot.keywords.slice(0, 2).join(', ')}`
      });
    }
  };

  // Trigger hint
  const handleTriggerHint = () => {
    if (!currentChallenge) return;
    const remaining = currentChallenge.hotspots.filter((h) => !currentFoundList.includes(h.id));
    if (remaining.length === 0) return;

    AudioFX.playHint();
    setHintsUsed((prev) => prev + 1);
    setScore((prev) => Math.max(0, prev - 15));
    setActiveHotspot(remaining[0]);
    setGuessInput('');
    setGuessFeedback(null);
  };

  // Finish game & upload to Google Sheets + Backend
  const handleFinishGame = async (foundMap = foundHotspotIds) => {
    setIsCompleted(true);
    const elapsed = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : timeElapsed;
    setTimeElapsed(elapsed);

    // Trigger victory fanfare & confetti
    AudioFX.playVictory();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }

    // Collect all detected tells details
    let totalHotspots = 0;
    let totalFound = 0;
    const foundDetails: Array<{ title: string; category: string; points: number }> = [];

    gameConfig.challenges.forEach((c, idx) => {
      totalHotspots += c.hotspots.length;
      const ids = foundMap[idx] || [];
      totalFound += ids.length;
      ids.forEach((id) => {
        const hs = c.hotspots.find((h) => h.id === id);
        if (hs) {
          foundDetails.push({ title: hs.title, category: hs.category, points: hs.points });
        }
      });
    });

    const accuracy = totalHotspots > 0 ? Math.round((totalFound / totalHotspots) * 100) : 100;

    // Send payload to Google Sheets & Backend
    setUploadStatus('uploading');
    setUploadMessage('Synchronizing player scores with Google Sheets...');

    try {
      const res = await submitScoreToIntegrations({
        playerName: player?.name || 'Anonymous Detective',
        playerEmail: player?.email || 'N/A',
        gameTitle: gameConfig.title,
        score,
        accuracy,
        totalTells: totalHotspots,
        foundTells: totalFound,
        hintsUsed,
        timeElapsedSeconds: elapsed,
        foundDetails,
        sheetsWebhookUrl: gameConfig.sheetsConfig?.webhookUrl
      });

      setUploadStatus('success');
      setUploadMessage(res.message || 'Score successfully logged to Google Sheets & database!');
      if (onRecordCompleted) onRecordCompleted();
    } catch (err) {
      setUploadStatus('fallback');
      setUploadMessage('Recorded locally. Check Google Sheets webhook URL in settings.');
    }
  };

  // ================= 1. REGISTRATION SCREEN (IMMERSIVE UI) =================
  if (!player && gameConfig.requirePlayerEntry) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#050508] relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600 blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900 blur-[160px]" />
          <div className="absolute top-[40%] right-[30%] w-[25%] h-[25%] rounded-full bg-cyan-500/20 blur-[120px]" />
        </div>

        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 lg:gap-12 z-10 items-stretch">
          {/* Left Form Panel */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full w-fit">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  Forensic Mission Protocol
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  AudioFX.playClick();
                  onBackToBuilder();
                }}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Return to Builder</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-3 text-white">
              PLAYER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">REGISTRATION</span>
            </h1>

            <p className="text-white/60 mb-6 leading-relaxed text-sm sm:text-base">
              Secure your position on the global grid. All forensic evidence, anomaly detection logs, and accuracy scores will be archived to Google Sheets in real-time.
            </p>

            <form onSubmit={handleStartGame} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-cyan-400 ml-1">
                  Identity Designation (Agent Name)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-4 text-white/40" />
                  <input
                    type="text"
                    required
                    placeholder="Pilot / Detective Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-white/20 text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-cyan-400 ml-1">
                  Communication Uplink (Email Address)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-4 text-white/40" />
                  <input
                    type="email"
                    required
                    placeholder="pilot@central-command.io"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-white/20 text-white text-sm"
                  />
                </div>
              </div>

              {entryError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {entryError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.3)] text-sm tracking-widest uppercase mt-2 border-t border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Initialize Game Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Live Archive Preview Panel */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex-1 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mission Rules & Live Archive</span>
                  </h3>
                  <span className="text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded text-cyan-300 font-mono">
                    ONLINE SYNC
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl mb-4">
                  <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{gameConfig.title}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{gameConfig.instructions}</p>
                </div>

                {/* Score Target & Limits */}
                <div className="grid grid-cols-2 gap-2.5 mb-4 text-[11px] font-mono">
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider">Pass Threshold</div>
                    <div className="text-cyan-400 font-bold">{gameConfig.passScorePercent}% Accuracy</div>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider">Mission Timer</div>
                    <div className="text-blue-400 font-bold">{gameConfig.timeLimit > 0 ? `${gameConfig.timeLimit} Seconds` : 'Unlimited'}</div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-[10px] uppercase font-bold text-white/30 px-3">
                    <div>Timestamp</div>
                    <div>Player ID</div>
                    <div className="text-right">Global Score</div>
                  </div>
                  <div className="h-[1px] bg-white/10 w-full" />
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="grid grid-cols-3 items-center py-2 px-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="text-white/40">14:22:01</div>
                      <div className="font-bold text-white font-sans truncate">Vesper_X</div>
                      <div className="text-right text-cyan-400 font-bold">849,200</div>
                    </div>
                    <div className="grid grid-cols-3 items-center py-2 px-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="text-white/40">14:18:45</div>
                      <div className="font-bold text-white font-sans truncate">Kaelo_09</div>
                      <div className="text-right text-cyan-400 font-bold">712,050</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span>Google Apps Script Endpoint Connected</span>
                </div>
                <span className="text-cyan-400 font-bold">AES-256</span>
              </div>
            </div>

            {/* Destination Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-cyan-500/40 flex items-center justify-center bg-cyan-500/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                </div>
                <div>
                  <div className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Spreadsheet Destination</div>
                  <div className="text-xs font-bold text-white font-mono truncate max-w-xs">
                    {gameConfig.sheetsConfig?.sheetName || 'PlayerScores'} &bull; Live Webhook
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase text-white/40 font-bold tracking-wider">Recording Status</div>
                <div className="text-xs font-bold text-cyan-400">READY TO LOG</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. ACTIVE GAMEPLAY INTERFACE =================
  const totalHotspotsAcrossCases = gameConfig.challenges.reduce((acc, c) => acc + c.hotspots.length, 0);
  let totalFoundAcrossCases = 0;
  Object.values(foundHotspotIds).forEach((arr: string[]) => {
    totalFoundAcrossCases += (arr || []).length;
  });

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#050508] overflow-hidden relative">
      {/* Top Playtest Bar */}
      <div className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Level Switcher if multi-case */}
          {gameConfig.challenges.length > 1 && (
            <select
              value={currentChallengeIndex}
              onChange={(e) => {
                AudioFX.playClick();
                setCurrentChallengeIndex(Number(e.target.value));
              }}
              className="bg-white/5 border border-white/15 text-cyan-400 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400 cursor-pointer"
            >
              {gameConfig.challenges.map((c, i) => (
                <option key={c.id} value={i} className="bg-[#0c0d16] text-white">
                  Case #{i + 1}: {c.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white/80 font-bold">
              Found: <strong className="text-cyan-400">{totalFoundAcrossCases}</strong> / {totalHotspotsAcrossCases}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 text-xs text-white/50">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="p-1 hover:text-white transition-colors">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="w-10 text-center font-mono text-[10px] text-white font-bold">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="p-1 hover:text-white transition-colors">
              <ZoomIn className="w-3 h-3" />
            </button>
            <button onClick={() => setZoom(1)} className="p-1 hover:text-white ml-1 pl-1.5 border-l border-white/10 transition-colors">
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Right Stats & Controls */}
        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <Star className="w-3.5 h-3.5 text-cyan-300" />
            <span>{score} PTS</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {gameConfig.timeLimit > 0
                ? `${Math.floor(timerSeconds / 60)
                    .toString()
                    .padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                : `${timeElapsed}s`}
            </span>
          </div>

          {/* Hint */}
          <button
            onClick={handleTriggerHint}
            className="bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Hint (-15pts)</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => handleStartGame()}
            className="text-white/60 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Restart Playtest"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Return to Builder button */}
          <button
            onClick={() => {
              AudioFX.playClick();
              onBackToBuilder();
            }}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            title="Exit Playtest and Return to Builder"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Builder</span>
          </button>
        </div>
      </div>

      {/* Main Playfield & Log */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Canvas Viewport */}
        <div ref={viewportRef} className="viewport" tabIndex={0}>
          <div className="canvas-stage">
            <div
              id="game-image-wrapper"
              onClick={handleCanvasClick}
              className="image-wrapper cursor-crosshair relative"
              style={{ width: `${800 * zoom}px` }}
            >
              <img
                ref={imageRef}
                src={currentChallenge.imageUrl}
                alt={currentChallenge.title}
                className="w-full block select-none pointer-events-none"
                draggable={false}
              />

              {/* Solved Pins Marker Layer */}
              <div className="hotspot-layer">
                {currentChallenge.hotspots.map((hs) => {
                  const isFound = currentFoundList.includes(hs.id);
                  if (!isFound) return null;
                  return (
                    <div
                      key={hs.id}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 solved-glow pointer-events-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-black flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(34,211,238,0.8)] border-2 border-white">
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Detected Tells Side Log */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-black/40 backdrop-blur-md flex flex-col shrink-0 max-h-48 md:max-h-none overflow-y-auto z-20">
          <div className="p-4 border-b border-white/10 flex items-center justify-between font-bold text-xs text-white/50 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <ListCheck className="w-4 h-4 text-cyan-400" />
              <span>Identified Artifacts</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-400">
              {currentChallenge.hotspots.length > 0
                ? Math.round((currentFoundList.length / currentChallenge.hotspots.length) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
            {currentFoundList.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-xs">
                <Crosshair className="w-6 h-6 mx-auto mb-2 text-white/30" />
                <p>Click anomalies on the canvas to inspect and identify AI flaws.</p>
              </div>
            ) : (
              currentFoundList.map((id) => {
                const hs = currentChallenge.hotspots.find((h) => h.id === id);
                if (!hs) return null;
                return (
                  <div
                    key={id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-cyan-500/30 text-xs space-y-1 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300">{hs.title}</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">+{hs.points} PTS</span>
                    </div>
                    <p className="text-[11px] text-white/60">{hs.explanation}</p>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* ================= GUESS MODAL ================= */}
      {activeHotspot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0b12] border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">AI Tell Detected</h3>
                  <p className="text-xs text-white/50">Describe the specific error or flaw:</p>
                </div>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hint box if available */}
            {activeHotspot.hint && (
              <div className="mb-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-2xl flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                <span>{activeHotspot.hint}</span>
              </div>
            )}

            {/* Input */}
            <div className="space-y-3.5">
              <textarea
                rows={3}
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitGuess();
                  }
                }}
                className="w-full bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 outline-none resize-none font-sans"
                placeholder="e.g. Asymmetrical eyeglass frames, 6 fingers on hand, distorted text sign..."
                autoFocus
              />

              {guessFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-medium border ${
                    guessFeedback.type === 'error'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {guessFeedback.msg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setActiveHotspot(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGuess}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Submit Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VICTORY & RESULTS MODAL ================= */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0b12] border border-white/15 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl text-center relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <h2 className="font-black text-2xl sm:text-3xl text-white mb-1 tracking-tight">Audit Completed!</h2>
            <p className="text-xs text-white/60 mb-6">
              Player Scorecard recorded for{' '}
              <strong className="text-cyan-400">
                {player?.name} ({player?.email})
              </strong>
            </p>

            {/* Scorecard Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Final Score</div>
                <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{score} PTS</div>
              </div>
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Tells Identified</div>
                <div className="text-xl font-mono font-bold text-blue-400 mt-1">
                  {totalFoundAcrossCases} / {totalHotspotsAcrossCases}
                </div>
              </div>
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Time Taken</div>
                <div className="text-xl font-mono font-bold text-purple-400 mt-1">{timeElapsed}s</div>
              </div>
            </div>

            {/* Sheets Sync Status Banner */}
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-center gap-2 mb-6 border ${
                uploadStatus === 'uploading'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : uploadStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              {uploadStatus === 'uploading' ? (
                <CloudUpload className="w-4 h-4 animate-bounce text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{uploadMessage}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  AudioFX.playClick();
                  exportScoresToCSV([
                    {
                      id: 'play-' + Date.now(),
                      playerName: player?.name || 'Player',
                      playerEmail: player?.email || 'N/A',
                      gameTitle: gameConfig.title,
                      score,
                      accuracy: totalHotspotsAcrossCases > 0 ? Math.round((totalFoundAcrossCases / totalHotspotsAcrossCases) * 100) : 100,
                      totalTells: totalHotspotsAcrossCases,
                      foundTells: totalFoundAcrossCases,
                      hintsUsed,
                      timeElapsedSeconds: timeElapsed,
                      completedAt: new Date().toISOString(),
                      foundDetails: []
                    }
                  ], `${(player?.name || 'player').replace(/[^a-z0-9]/gi, '_')}_scorecard.csv`);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Excel/CSV</span>
              </button>

              <button
                onClick={() => handleStartGame()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onBackToBuilder}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                Back to Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
