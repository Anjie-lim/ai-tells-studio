export interface Hotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number; // percentage 4-25
  title: string;
  category: string;
  keywords: string[];
  hint: string;
  explanation: string;
  points: number;
}

export interface Challenge {
  id: string;
  title: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

export interface SheetsConfig {
  enabled: boolean;
  webhookUrl: string; // Google Apps Script web app URL or webhook
  autoSubmit: boolean;
  syncWithBackend: boolean;
  sheetName: string;
  recordedFields: string[];
}

export interface GameConfig {
  title: string;
  instructions: string;
  timeLimit: number; // in seconds, 0 for unlimited
  passScorePercent: number;
  soundEnabled: boolean;
  requirePlayerEntry: boolean;
  challenges: Challenge[];
  sheetsConfig: SheetsConfig;
}

export interface PlayerScoreRecord {
  id: string;
  playerName: string;
  playerEmail: string;
  gameTitle: string;
  score: number;
  accuracy: number;
  totalTells: number;
  foundTells: number;
  hintsUsed: number;
  timeElapsedSeconds: number;
  completedAt: string;
  foundDetails: Array<{
    title: string;
    category: string;
    points: number;
  }>;
}

export interface PlayerInfo {
  name: string;
  email: string;
}

export type ActiveView = 'builder' | 'playtest' | 'scores';
