import { GameConfig } from '../types';

export function createSamplePortraitSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <rect width="800" height="600" fill="#0f172a"/>
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#14b8a6"/>
        <stop offset="100%" stop-color="#6366f1"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    
    <!-- Background Backdrop -->
    <rect width="800" height="600" fill="url(#bg)"/>
    <circle cx="400" cy="280" r="260" fill="url(#glow)"/>
    
    <text x="50" y="70" font-family="sans-serif" font-size="14" fill="#64748b" font-weight="bold" letter-spacing="2">CASE FILE // #001: SYNTHETIC PORTRAIT</text>
    <text x="50" y="95" font-family="sans-serif" font-size="11" fill="#475569">Target: Analyze anatomical and geometrical inconsistencies</text>
    
    <!-- Subject Body & Suit -->
    <path d="M 230 600 C 230 460, 310 400, 400 400 C 490 400, 570 460, 570 600 Z" fill="#1e293b" stroke="#334155" stroke-width="4"/>
    <path d="M 350 400 L 400 490 L 450 400 Z" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <rect x="375" y="330" width="50" height="80" fill="#fca5a5" opacity="0.9" rx="6"/>
    
    <!-- Subject Head -->
    <ellipse cx="400" cy="250" rx="100" ry="125" fill="#fca5a5"/>
    <path d="M 300 240 C 290 140, 510 140, 500 240 C 480 180, 320 180, 300 240 Z" fill="#334155"/>
    
    <!-- TELL 1: Mismatched Glasses (Square on left, Oval on right) -->
    <!-- Left eyeglass frame: Sharp rectangle -->
    <rect x="320" y="215" width="65" height="46" rx="4" fill="none" stroke="#00f0ff" stroke-width="5"/>
    <!-- Right eyeglass frame: Warped skewed oval -->
    <ellipse cx="465" cy="238" rx="40" ry="24" fill="none" stroke="#00f0ff" stroke-width="5" transform="rotate(-15 465 238)"/>
    <!-- Distorted bridge -->
    <line x1="385" y1="235" x2="425" y2="242" stroke="#00f0ff" stroke-width="5"/>
    
    <!-- Pupils / Eyes inside glasses -->
    <circle cx="352" cy="238" r="10" fill="#0f172a"/>
    <circle cx="460" cy="238" r="10" fill="#0f172a"/>
    
    <!-- Nose & Mouth -->
    <path d="M 395 245 L 390 280 L 405 280" fill="none" stroke="#991b1b" stroke-width="3" stroke-linecap="round"/>
    <path d="M 370 315 Q 400 335 430 315" fill="none" stroke="#991b1b" stroke-width="4" stroke-linecap="round"/>
    
    <!-- TELL 2: 6-Fingered Hand -->
    <g transform="translate(480, 420)">
      <rect x="0" y="20" width="85" height="50" rx="14" fill="#fca5a5" stroke="#f87171" stroke-width="2"/>
      <rect x="-8" y="-12" width="11" height="38" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
      <rect x="7" y="-22" width="11" height="48" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
      <rect x="22" y="-28" width="11" height="54" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
      <rect x="37" y="-26" width="11" height="52" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
      <rect x="52" y="-18" width="11" height="44" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
      <rect x="67" y="-8" width="11" height="34" rx="5" fill="#fca5a5" stroke="#f87171" stroke-width="1.5"/>
    </g>

    <!-- TELL 3: Floating / Disconnected Earring and Ear Anomaly -->
    <circle cx="288" cy="285" r="14" fill="#eab308" opacity="0.9"/>
    <line x1="288" y1="260" x2="288" y2="271" stroke="#eab308" stroke-width="3" stroke-dasharray="2,2"/>
    <circle cx="288" cy="250" r="4" fill="#fca5a5"/>
    
    <!-- Aesthetic UI Corner Decals -->
    <path d="M 20 50 L 20 20 L 50 20" fill="none" stroke="#14b8a6" stroke-width="3"/>
    <path d="M 780 50 L 780 20 L 750 20" fill="none" stroke="#14b8a6" stroke-width="3"/>
    <path d="M 20 550 L 20 580 L 50 580" fill="none" stroke="#14b8a6" stroke-width="3"/>
    <path d="M 780 550 L 780 580 L 750 580" fill="none" stroke="#14b8a6" stroke-width="3"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export function createSampleStreetSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <rect width="800" height="600" fill="#090d16"/>
    <!-- Sky & Perspective Grid -->
    <defs>
      <linearGradient id="cyberSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="60%" stop-color="#312e81"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#cyberSky)"/>
    <rect y="360" width="800" height="240" fill="#1e293b"/>
    
    <!-- Buildings -->
    <rect x="40" y="100" width="160" height="260" fill="#0f172a" stroke="#334155" stroke-width="3"/>
    <rect x="220" y="60" width="180" height="300" fill="#1e1b4b" stroke="#4338ca" stroke-width="3"/>
    <rect x="580" y="120" width="180" height="240" fill="#0f172a" stroke="#334155" stroke-width="3"/>
    
    <!-- TELL 1: Gibberish AI Neon Sign Text (Impossible Letters) -->
    <g transform="translate(240, 110)">
      <rect x="0" y="0" width="140" height="45" rx="8" fill="#022c22" stroke="#10b981" stroke-width="3"/>
      <text x="12" y="32" font-family="monospace" font-size="22" fill="#34d399" font-weight="900" letter-spacing="4">Ψ§ЖØ¶</text>
    </g>
    
    <!-- TELL 2: Car with 3 Wheels visible in impossible perspective -->
    <g transform="translate(460, 390)">
      <path d="M 20 40 L 50 10 L 140 10 L 170 40 L 190 45 L 190 70 L 10 70 L 10 45 Z" fill="#dc2626"/>
      <circle cx="45" cy="70" r="18" fill="#000" stroke="#94a3b8" stroke-width="4"/>
      <circle cx="105" cy="70" r="18" fill="#000" stroke="#94a3b8" stroke-width="4"/>
      <circle cx="160" cy="70" r="18" fill="#000" stroke="#94a3b8" stroke-width="4"/>
    </g>
    
    <!-- Street markings and lamps -->
    <line x1="400" y1="360" x2="200" y2="600" stroke="#eab308" stroke-width="4" stroke-dasharray="20,15"/>
    <line x1="400" y1="360" x2="600" y2="600" stroke="#eab308" stroke-width="4" stroke-dasharray="20,15"/>
    
    <text x="50" y="50" font-family="sans-serif" font-size="14" fill="#38bdf8" font-weight="bold">CASE FILE // #002: URBAN GENERATION GLITCH</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export const initialGameConfig: GameConfig = {
  title: "AI Artifact Detective Challenge",
  instructions: "Inspect the generated synthetic images carefully. Click on anatomical, textural, and geometrical anomalies, then identify the specific AI flaw to log your score.",
  timeLimit: 180,
  passScorePercent: 70,
  soundEnabled: true,
  requirePlayerEntry: true,
  sheetsConfig: {
    enabled: true,
    webhookUrl: "", // Users can paste their Google Apps Script webhook URL
    autoSubmit: true,
    syncWithBackend: true,
    sheetName: "AI Detective Player Scores",
    recordedFields: [
      "Timestamp",
      "Player Name",
      "Player Email",
      "Game Title",
      "Score",
      "Accuracy",
      "Tells Identified",
      "Hints Used",
      "Time Elapsed (sec)",
      "Detected Flaws Summary"
    ]
  },
  challenges: [
    {
      id: "chal-01",
      title: "Synthetic Portrait Audit",
      imageUrl: createSamplePortraitSVG(),
      hotspots: [
        {
          id: "hs-101",
          x: 48,
          y: 39,
          radius: 8,
          title: "Asymmetrical Eyeglass Frames",
          category: "Objects / Geometry",
          keywords: ["glasses", "frame", "eyeglass", "asymmetry", "lens", "spectacles", "shape", "square", "circle"],
          hint: "Check the geometry of both sides of the subject's eyeglasses.",
          explanation: "AI generators frequently struggle with symmetrical manufactured objects, rendering one frame square and the other oval.",
          points: 100
        },
        {
          id: "hs-102",
          x: 65,
          y: 72,
          radius: 9,
          title: "Extra 6th Finger on Hand",
          category: "Anatomy",
          keywords: ["finger", "hand", "6", "six", "extra", "digits", "polydactyly", "fingers"],
          hint: "Count the digits on the hand resting near the right side.",
          explanation: "Complex hand pose estimation is a notorious AI hallucination; this hand depicts six full fingers.",
          points: 100
        },
        {
          id: "hs-103",
          x: 36,
          y: 44,
          radius: 7,
          title: "Floating Disconnected Earring",
          category: "Physics & Anatomy",
          keywords: ["ear", "earring", "floating", "jewelry", "disconnected", "lobe"],
          hint: "Look at the ear area on the left side where jewelry meets the earlobe.",
          explanation: "The earring is rendered floating disconnected from any coherent ear anatomy.",
          points: 100
        }
      ]
    },
    {
      id: "chal-02",
      title: "Urban Scene Perspective Glitch",
      imageUrl: createSampleStreetSVG(),
      hotspots: [
        {
          id: "hs-201",
          x: 39,
          y: 22,
          radius: 8,
          title: "Gibberish Non-Existent Text",
          category: "Text Rendering",
          keywords: ["text", "letters", "gibberish", "sign", "words", "alphabet", "symbols", "language", "neon"],
          hint: "Try to read the characters displayed on the illuminated green storefront sign.",
          explanation: "Diffusion models frequently render pseudo-glyphs and incomprehensible symbols instead of legitimate text.",
          points: 100
        },
        {
          id: "hs-202",
          x: 68,
          y: 72,
          radius: 9,
          title: "Impossible 3-Wheeled Car Side",
          category: "Objects / Geometry",
          keywords: ["car", "wheel", "wheels", "tire", "3", "three", "vehicle"],
          hint: "Count the wheels along the single side profile of the red vehicle.",
          explanation: "The vehicle side features 3 consecutive wheels defying automotive wheel alignment.",
          points: 100
        }
      ]
    }
  ]
};
