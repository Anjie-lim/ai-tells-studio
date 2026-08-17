import { GameConfig } from '../types';

export function generateStandaloneGameHtml(gameConfig: GameConfig): string {
  const configJson = JSON.stringify(gameConfig);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameConfig.title || 'AI Artifact Detective Challenge'}</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        teal: {
                            400: '#2dd4bf',
                            500: '#14b8a6',
                            600: '#0d9488',
                            900: '#134e4a'
                        }
                    },
                    fontFamily: {
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace']
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #050508;
            color: #f1f5f9;
            user-select: none;
            overflow: hidden;
            height: 100vh;
            margin: 0;
        }
        .viewport {
            flex: 1;
            background-color: #050508;
            background-image: 
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 32px 32px;
            overflow: auto;
            position: relative;
            outline: none;
        }
        .canvas-stage {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 100%;
            min-height: 100%;
            padding: 160px;
        }
        .image-wrapper {
            position: relative;
            box-shadow: 0 0 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.1);
            background-color: #000;
            border-radius: 12px;
            overflow: hidden;
            flex-shrink: 0;
        }
        #game-image {
            display: block;
            width: 800px;
            max-width: none;
            user-select: none;
            pointer-events: none;
        }
        .hotspot-layer {
            position: absolute;
            inset: 0;
            z-index: 10;
            pointer-events: none;
        }
        .solved-glow {
            filter: drop-shadow(0 0 12px #22d3ee);
        }
        @keyframes pulseGlow {
            0% { transform: translate(-50%, -50%) scale(0.96); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.6); }
            70% { transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 0 14px rgba(34, 211, 238, 0); }
            100% { transform: translate(-50%, -50%) scale(0.96); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
    </style>
</head>
<body class="h-screen w-screen flex flex-col overflow-hidden bg-[#050508] text-white">

    <!-- ================= SCREEN 1: PLAYER ENTRY / REGISTRATION ================= -->
    <div id="screen-entry" class="fixed inset-0 bg-[#050508] z-50 flex items-center justify-center p-4">
        <!-- Ambient glows -->
        <div class="fixed top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div class="fixed bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div class="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div class="relative z-10">
                <!-- Header Badge -->
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                        <i class="fa-solid fa-user-shield text-white"></i>
                    </div>
                    <div>
                        <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">Agent Registration</div>
                        <h2 class="text-xl font-extrabold text-white" id="entry-game-title">${gameConfig.title || 'AI Artifact Detective'}</h2>
                    </div>
                </div>

                <!-- Briefing -->
                <div class="bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
                    <div class="flex items-center gap-2 text-xs font-bold text-white mb-1.5">
                        <i class="fa-solid fa-circle-info text-cyan-400"></i> Mission Briefing
                    </div>
                    <p class="text-xs text-white/60 leading-relaxed">${gameConfig.instructions || 'Inspect the generated images carefully and identify the synthetic flaws.'}</p>
                    
                    <div class="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 font-mono">
                        <span><i class="fa-solid fa-stopwatch text-cyan-400 mr-1"></i> Time: ${gameConfig.timeLimit > 0 ? gameConfig.timeLimit + 's' : 'Unlimited'}</span>
                        <span><i class="fa-solid fa-file-excel text-emerald-400 mr-1"></i> Sync: Google Sheets</span>
                    </div>
                </div>

                <!-- Registration Form -->
                <form id="player-entry-form" onsubmit="handlePlayerStart(event)" class="space-y-4">
                    <div>
                        <label class="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">Player / Agent Name <span class="text-rose-400">*</span></label>
                        <div class="relative">
                            <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-white/30 text-xs"></i>
                            <input type="text" id="input-player-name" required placeholder="Enter your full name" class="w-full bg-black/40 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all font-sans">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">Player Email Address <span class="text-rose-400">*</span></label>
                        <div class="relative">
                            <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-white/30 text-xs"></i>
                            <input type="email" id="input-player-email" required placeholder="name@organization.com" class="w-full bg-black/40 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all font-sans">
                        </div>
                        <p class="text-[10px] text-white/40 mt-1">Your score and analysis scorecard will be logged under this email.</p>
                    </div>

                    <div id="entry-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium"></div>

                    <button type="submit" class="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 border-t border-white/20 cursor-pointer">
                        <span>Begin Forensic Audit</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- ================= SCREEN 2: GAMEPLAY INTERFACE ================= -->
    <header class="h-16 border-b border-white/10 bg-[#050508]/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <div>
                <h1 class="font-bold text-sm sm:text-base leading-tight text-white">${gameConfig.title || 'AI Artifact Detective'}</h1>
                <p class="text-[11px] text-white/50">Agent: <span id="header-player-name" class="text-cyan-400 font-semibold font-mono">--</span></p>
            </div>
        </div>

        <!-- Middle: Level select if multiple -->
        <div id="level-select-container" class="hidden items-center gap-2 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
            <span class="text-xs text-white/50 font-semibold">Case:</span>
            <select id="level-select" onchange="changeLevel(parseInt(this.value))" class="bg-transparent text-cyan-400 text-xs font-bold outline-none cursor-pointer"></select>
        </div>

        <!-- Right: Stats & Controls -->
        <div class="flex items-center gap-2 sm:gap-4 font-mono text-xs">
            <!-- Points -->
            <div class="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-star"></i> <span id="stat-score">0</span> PTS
            </div>

            <!-- Timer -->
            <div class="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-stopwatch"></i> <span id="stat-timer">--:--</span>
            </div>

            <!-- Found counter -->
            <div class="bg-white/5 border border-white/10 text-white/80 px-3 py-1.5 rounded-full font-bold hidden sm:flex items-center gap-1.5">
                <i class="fa-solid fa-crosshair text-cyan-400"></i> <span id="stat-found">0</span> / <span id="stat-total">0</span>
            </div>

            <!-- Hint Button -->
            <button onclick="triggerHint()" class="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-xl border border-white/10 font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                <i class="fa-regular fa-lightbulb text-amber-400"></i> <span class="hidden md:inline">Hint</span>
            </button>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 flex overflow-hidden relative">
        <!-- Viewport Stage -->
        <div class="viewport" id="viewport" tabindex="0">
            <div class="canvas-stage">
                <div id="image-wrapper" class="image-wrapper cursor-crosshair">
                    <img id="game-image" alt="AI Challenge Image" />
                    <div id="hotspot-layer" class="hotspot-layer"></div>
                </div>
            </div>
        </div>

        <!-- Right Sidebar Audit Log -->
        <aside class="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-[#0a0b12]/95 backdrop-blur-md flex flex-col shrink-0 max-h-48 md:max-h-none overflow-y-auto z-20">
            <div class="p-3.5 border-b border-white/10 flex items-center justify-between font-bold text-xs text-white/50 uppercase tracking-wider bg-black/40">
                <span class="flex items-center gap-2"><i class="fa-solid fa-list-check text-cyan-400"></i> Identified Artifacts</span>
                <span id="stat-progress-pct" class="text-cyan-400 font-mono">0%</span>
            </div>
            <div id="log-container" class="p-3 space-y-2.5 flex-1 overflow-y-auto">
                <div class="text-center py-10 text-white/40 text-xs">
                    <i class="fa-solid fa-fingerprint text-2xl text-white/20 mb-2"></i>
                    <p>Click anomalies on the image to audit and solve them.</p>
                </div>
            </div>
        </aside>
    </main>

    <!-- ================= MODAL: GUESS AUDIT ================= -->
    <div id="modal-guess" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-[#0a0b12] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono">
                        <i class="fa-solid fa-bullseye"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-base text-white">AI Tell Detected</h3>
                        <p class="text-xs text-white/50">Describe the specific flaw in this region:</p>
                    </div>
                </div>
                <button onclick="closeGuessModal()" class="text-white/40 hover:text-white cursor-pointer">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <!-- Hint box if active -->
            <div id="guess-hint-box" class="hidden mb-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl flex items-start gap-2">
                <i class="fa-solid fa-circle-info mt-0.5 text-amber-400"></i>
                <span id="guess-hint-text"></span>
            </div>

            <div class="space-y-3">
                <textarea id="guess-input" rows="3" class="w-full bg-black/40 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none resize-none font-sans" placeholder="e.g. Asymmetrical glasses, extra finger on hand, distorted text..."></textarea>
                <div id="guess-feedback" class="hidden p-3 rounded-xl text-xs font-medium border"></div>

                <div class="flex items-center justify-end gap-2 pt-1">
                    <button onclick="closeGuessModal()" class="px-3 py-1.5 text-xs font-semibold text-white/40 hover:text-white cursor-pointer">Cancel</button>
                    <button onclick="submitGuess()" class="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-check"></i> Submit Audit
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ================= MODAL: RESULTS & GOOGLE SHEETS UPLOAD ================= -->
    <div id="modal-victory" class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-[#0a0b12] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl text-center relative">
            <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-3xl shadow-[0_0_25px_rgba(34,211,238,0.3)]">
                <i class="fa-solid fa-trophy"></i>
            </div>
            
            <h2 class="font-extrabold text-2xl text-white mb-1">Audit Completed!</h2>
            <p class="text-xs text-white/50 mb-5">Player Scorecard recorded for <strong id="victory-player-name" class="text-cyan-400">Agent</strong></p>

            <!-- Score Stats Grid -->
            <div class="grid grid-cols-3 gap-2.5 mb-5">
                <div class="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div class="text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Score</div>
                    <div id="victory-score" class="text-xl font-mono font-bold text-cyan-400 mt-1">0 PTS</div>
                </div>
                <div class="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div class="text-[10px] text-white/40 font-bold uppercase tracking-wider">Tells Solved</div>
                    <div id="victory-tells" class="text-xl font-mono font-bold text-emerald-400 mt-1">0 / 0</div>
                </div>
                <div class="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div class="text-[10px] text-white/40 font-bold uppercase tracking-wider">Time Elapsed</div>
                    <div id="victory-time" class="text-xl font-mono font-bold text-blue-400 mt-1">0s</div>
                </div>
            </div>

            <!-- Sheets Sync Status Banner -->
            <div id="sheets-sync-status" class="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 mb-6">
                <i class="fa-solid fa-cloud-arrow-up animate-pulse text-cyan-400"></i>
                <span id="sheets-sync-msg">Syncing results with Google Sheets...</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button onclick="downloadPlayerScorecardCSV()" class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <i class="fa-solid fa-file-csv text-emerald-400"></i> Download CSV Record
                </button>
                <button onclick="restartGame()" class="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer">
                    <i class="fa-solid fa-rotate-right"></i> Play Again
                </button>
            </div>
        </div>
    </div>

    <!-- ================= CLIENT JAVASCRIPT ================= -->
    <script>
        const CONFIG = ${configJson};
        
        let player = { name: '', email: '' };
        let currentChallengeIndex = 0;
        let foundMap = {}; // challengeIndex -> array of hotspot IDs
        let score = 0;
        let hintsUsed = 0;
        let timerSeconds = CONFIG.timeLimit || 0;
        let timerInterval = null;
        let activeSpot = null;
        let gameStartTime = null;
        let timeElapsedSeconds = 0;
        let isGameFinished = false;

        // Web Audio Synthesizer
        const AudioFX = {
            ctx: null,
            init() {
                if (!this.ctx && window.AudioContext) {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                }
            },
            play(freq, type, duration, gainVal = 0.1) {
                if (!CONFIG.soundEnabled) return;
                try {
                    this.init();
                    if (!this.ctx) return;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch(e) {}
            },
            click() { this.play(500, 'sine', 0.06, 0.04); },
            success() {
                this.play(523.25, 'triangle', 0.12, 0.08);
                setTimeout(() => this.play(659.25, 'triangle', 0.12, 0.08), 100);
                setTimeout(() => this.play(783.99, 'triangle', 0.25, 0.1), 200);
            },
            error() { this.play(180, 'sawtooth', 0.18, 0.08); },
            hint() { this.play(392, 'sine', 0.18, 0.06); },
            victory() {
                [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                    setTimeout(() => this.play(f, 'triangle', 0.25, 0.1), i * 130);
                });
            }
        };

        window.onload = function() {
            // Check if player entry is required
            if (CONFIG.requirePlayerEntry) {
                document.getElementById('screen-entry').classList.remove('hidden');
            } else {
                player = { name: 'Player 1', email: 'player@example.com' };
                startGame();
            }
        };

        function handlePlayerStart(e) {
            e.preventDefault();
            const nameInput = document.getElementById('input-player-name').value.trim();
            const emailInput = document.getElementById('input-player-email').value.trim();
            const errEl = document.getElementById('entry-error');

            if (!nameInput || !emailInput) {
                errEl.textContent = 'Please provide both your name and email address.';
                errEl.classList.remove('hidden');
                return;
            }

            player = { name: nameInput, email: emailInput };
            document.getElementById('screen-entry').classList.add('hidden');
            AudioFX.click();
            startGame();
        }

        function startGame() {
            document.getElementById('header-player-name').textContent = player.name;
            gameStartTime = Date.now();
            score = 0;
            hintsUsed = 0;
            foundMap = {};
            isGameFinished = false;

            if (CONFIG.challenges && CONFIG.challenges.length > 1) {
                const container = document.getElementById('level-select-container');
                const sel = document.getElementById('level-select');
                container.classList.remove('hidden');
                container.classList.add('flex');
                sel.innerHTML = CONFIG.challenges.map((c, i) => '<option value="' + i + '">#' + (i + 1) + ' ' + c.title + '</option>').join('');
            }

            loadChallenge(0);
            startTimer();
            setupViewportClicks();
        }

        function changeLevel(idx) {
            AudioFX.click();
            loadChallenge(idx);
        }

        function loadChallenge(idx) {
            currentChallengeIndex = idx;
            const chal = CONFIG.challenges[idx];
            if (!chal) return;

            const foundIds = foundMap[idx] || [];
            document.getElementById('stat-total').textContent = chal.hotspots.length;
            document.getElementById('stat-found').textContent = foundIds.length;
            document.getElementById('stat-score').textContent = score;

            const img = document.getElementById('game-image');
            img.src = chal.imageUrl;

            renderPins();
            renderAuditLog();
        }

        function setupViewportClicks() {
            const wrapper = document.getElementById('image-wrapper');
            wrapper.addEventListener('click', (e) => {
                if (isGameFinished) return;
                const img = document.getElementById('game-image');
                const rect = img.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;

                if (px < 0 || px > rect.width || py < 0 || py > rect.height) return;

                const chal = CONFIG.challenges[currentChallengeIndex];
                const foundIds = foundMap[currentChallengeIndex] || [];
                let hitSpot = null;

                for (let hs of chal.hotspots) {
                    if (foundIds.includes(hs.id)) continue;
                    const hx = (hs.x / 100) * rect.width;
                    const hy = (hs.y / 100) * rect.height;
                    const hr = (hs.radius / 100) * rect.width;
                    const dist = Math.sqrt(Math.pow(px - hx, 2) + Math.pow(py - hy, 2));
                    if (dist <= hr) {
                        hitSpot = hs;
                        break;
                    }
                }

                if (hitSpot) {
                    AudioFX.click();
                    openGuessModal(hitSpot);
                } else {
                    AudioFX.error();
                }
            });
        }

        function openGuessModal(hs) {
            activeSpot = hs;
            document.getElementById('modal-guess').classList.remove('hidden');
            document.getElementById('guess-input').value = '';
            document.getElementById('guess-feedback').classList.add('hidden');
            
            const hintBox = document.getElementById('guess-hint-box');
            if (hs.hint) {
                document.getElementById('guess-hint-text').textContent = hs.hint;
                hintBox.classList.remove('hidden');
            } else {
                hintBox.classList.add('hidden');
            }
        }

        function closeGuessModal() {
            document.getElementById('modal-guess').classList.add('hidden');
            activeSpot = null;
        }

        function submitGuess() {
            if (!activeSpot) return;
            const input = document.getElementById('guess-input').value.trim().toLowerCase();
            const feedbackEl = document.getElementById('guess-feedback');

            if (!input) {
                feedbackEl.textContent = 'Please enter a description of the flaw.';
                feedbackEl.className = 'p-3 rounded-xl text-xs font-medium border bg-rose-500/10 text-rose-300 border-rose-500/30';
                feedbackEl.classList.remove('hidden');
                return;
            }

            const isCorrect = activeSpot.keywords.some(kw => input.includes(kw.toLowerCase()));

            if (isCorrect) {
                AudioFX.success();
                if (!foundMap[currentChallengeIndex]) foundMap[currentChallengeIndex] = [];
                if (!foundMap[currentChallengeIndex].includes(activeSpot.id)) {
                    foundMap[currentChallengeIndex].push(activeSpot.id);
                    score += (activeSpot.points || 100);
                }

                document.getElementById('stat-score').textContent = score;
                loadChallenge(currentChallengeIndex);
                closeGuessModal();

                checkCompletion();
            } else {
                AudioFX.error();
                feedbackEl.innerHTML = '<strong>Incorrect.</strong> Clue keywords: <em>' + activeSpot.keywords.slice(0, 2).join(', ') + '</em>';
                feedbackEl.className = 'p-3 rounded-xl text-xs font-medium border bg-amber-500/10 text-amber-300 border-amber-500/30';
                feedbackEl.classList.remove('hidden');
            }
        }

        function triggerHint() {
            AudioFX.hint();
            const chal = CONFIG.challenges[currentChallengeIndex];
            const foundIds = foundMap[currentChallengeIndex] || [];
            const remaining = chal.hotspots.filter(h => !foundIds.includes(h.id));
            if (remaining.length === 0) return;

            hintsUsed++;
            score = Math.max(0, score - 15);
            document.getElementById('stat-score').textContent = score;
            openGuessModal(remaining[0]);
        }

        function renderPins() {
            const layer = document.getElementById('hotspot-layer');
            const chal = CONFIG.challenges[currentChallengeIndex];
            const foundIds = foundMap[currentChallengeIndex] || [];
            layer.innerHTML = chal.hotspots.map(hs => {
                if (!foundIds.includes(hs.id)) return '';
                return '<div style="left: ' + hs.x + '%; top: ' + hs.y + '%;" class="absolute -translate-x-1/2 -translate-y-1/2 solved-glow pointer-events-none">' +
                    '<div class="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white">' +
                    '<i class="fa-solid fa-check"></i></div></div>';
            }).join('');
        }

        function renderAuditLog() {
            const logEl = document.getElementById('log-container');
            const chal = CONFIG.challenges[currentChallengeIndex];
            const foundIds = foundMap[currentChallengeIndex] || [];
            const pct = Math.round((foundIds.length / chal.hotspots.length) * 100) || 0;
            document.getElementById('stat-progress-pct').textContent = pct + '%';

            if (foundIds.length === 0) {
                logEl.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs"><i class="fa-solid fa-fingerprint text-2xl text-slate-600 mb-2"></i><p>Click anomalies on the image to audit and solve them.</p></div>';
                return;
            }

            logEl.innerHTML = foundIds.map(id => {
                const hs = chal.hotspots.find(h => h.id === id);
                return '<div class="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1">' +
                    '<div class="flex items-center justify-between">' +
                    '<span class="font-bold text-emerald-400">' + hs.title + '</span>' +
                    '<span class="text-[10px] font-mono text-amber-400">+' + hs.points + ' PTS</span>' +
                    '</div>' +
                    '<p class="text-[11px] text-slate-400">' + hs.explanation + '</p>' +
                    '</div>';
            }).join('');
        }

        function startTimer() {
            if (timerInterval) clearInterval(timerInterval);
            if (CONFIG.timeLimit <= 0) {
                document.getElementById('stat-timer').textContent = 'Unlimited';
                return;
            }

            timerSeconds = CONFIG.timeLimit;
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                timerSeconds--;
                updateTimerDisplay();
                if (timerSeconds <= 0) {
                    clearInterval(timerInterval);
                    finishGame();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const m = Math.floor(timerSeconds / 60);
            const s = timerSeconds % 60;
            document.getElementById('stat-timer').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        function checkCompletion() {
            let totalHotspots = 0;
            let totalFound = 0;
            CONFIG.challenges.forEach((c, idx) => {
                totalHotspots += c.hotspots.length;
                totalFound += (foundMap[idx] || []).length;
            });

            if (totalFound >= totalHotspots) {
                setTimeout(() => finishGame(), 400);
            }
        }

        function finishGame() {
            if (timerInterval) clearInterval(timerInterval);
            isGameFinished = true;
            timeElapsedSeconds = Math.round((Date.now() - gameStartTime) / 1000);
            AudioFX.victory();

            let totalHotspots = 0;
            let totalFound = 0;
            let detectedList = [];

            CONFIG.challenges.forEach((c, idx) => {
                totalHotspots += c.hotspots.length;
                const fIds = foundMap[idx] || [];
                totalFound += fIds.length;
                fIds.forEach(id => {
                    const hs = c.hotspots.find(h => h.id === id);
                    if (hs) detectedList.push(hs.title);
                });
            });

            const accuracy = totalHotspots > 0 ? Math.round((totalFound / totalHotspots) * 100) : 100;

            document.getElementById('victory-player-name').textContent = player.name + ' (' + player.email + ')';
            document.getElementById('victory-score').textContent = score + ' PTS';
            document.getElementById('victory-tells').textContent = totalFound + ' / ' + totalHotspots;
            document.getElementById('victory-time').textContent = timeElapsedSeconds + 's';
            document.getElementById('modal-victory').classList.remove('hidden');

            // Automatic upload to Google Sheets
            uploadResultsToSheets({
                timestamp: new Date().toISOString(),
                playerName: player.name,
                playerEmail: player.email,
                gameTitle: CONFIG.title || 'AI Artifact Detective',
                score: score,
                accuracyPercent: accuracy + '%',
                foundTells: totalFound + '/' + totalHotspots,
                hintsUsed: hintsUsed,
                timeElapsedSec: timeElapsedSeconds,
                detectedTells: detectedList.join('; ')
            });
        }

        function uploadResultsToSheets(payload) {
            const statusEl = document.getElementById('sheets-sync-status');
            const msgEl = document.getElementById('sheets-sync-msg');

            const webhookUrl = (CONFIG.sheetsConfig && CONFIG.sheetsConfig.webhookUrl) ? CONFIG.sheetsConfig.webhookUrl.trim() : '';

            if (!webhookUrl) {
                statusEl.className = 'p-3 rounded-2xl bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 mb-6 border border-slate-700';
                msgEl.innerHTML = '<i class="fa-solid fa-check text-teal-400"></i> Score recorded. (To link with Google Sheets, creator configures Apps Script URL in Studio)';
                return;
            }

            statusEl.className = 'p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium flex items-center justify-center gap-2 mb-6';
            msgEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up animate-bounce text-teal-400"></i> Transmitting player results to Google Sheets...';

            try {
                fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(() => {
                    statusEl.className = 'p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 mb-6';
                    msgEl.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i> Successfully uploaded player score and details to Google Sheets!';
                }).catch((err) => {
                    statusEl.className = 'p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-2 mb-6';
                    msgEl.innerHTML = '<i class="fa-solid fa-circle-info text-amber-400"></i> Recorded locally. (Sheets webhook completed with client status)';
                });
            } catch (e) {
                console.error(e);
            }
        }

        function downloadPlayerScorecardCSV() {
            const csv = "Timestamp,Player Name,Player Email,Game Title,Score,Time Elapsed (s)\\n" +
                '"' + new Date().toISOString() + '","' + player.name.replace(/"/g, '""') + '","' + player.email.replace(/"/g, '""') + '","' + (CONFIG.title || 'AI Detective').replace(/"/g, '""') + '",' + score + ',' + timeElapsedSeconds;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (player.name || 'player').replace(/[^a-z0-9]/gi, '_') + '_scorecard.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function restartGame() {
            document.getElementById('modal-victory').classList.add('hidden');
            startGame();
        }
    </script>
</body>
</html>`;
}
