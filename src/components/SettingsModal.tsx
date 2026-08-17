import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Volume2, 
  Clock, 
  UserCheck, 
  Activity, 
  Send,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { GameConfig } from '../types';
import { generateGoogleAppsScriptCode } from '../utils/sheetsIntegration';
import { AudioFX } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameConfig: GameConfig;
  onSaveConfig: (updated: Partial<GameConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  gameConfig,
  onSaveConfig
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'game'>('sheets');
  
  // Local form state
  const [title, setTitle] = useState(gameConfig.title);
  const [instructions, setInstructions] = useState(gameConfig.instructions);
  const [timeLimit, setTimeLimit] = useState(gameConfig.timeLimit);
  const [passScore, setPassScore] = useState(gameConfig.passScorePercent);
  const [soundEnabled, setSoundEnabled] = useState(gameConfig.soundEnabled);
  const [requirePlayerEntry, setRequirePlayerEntry] = useState(gameConfig.requirePlayerEntry);
  
  // Sheets settings
  const [webhookUrl, setWebhookUrl] = useState(gameConfig.sheetsConfig?.webhookUrl || '');
  const [sheetName, setSheetName] = useState(gameConfig.sheetsConfig?.sheetName || 'PlayerScores');
  const [copiedScript, setCopiedScript] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScriptCode(sheetName);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    AudioFX.playClick();
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus({ loading: false, success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }

    setTestStatus({ loading: true, message: 'Testing Google Sheets webhook connection...' });
    try {
      const res = await fetch('/api/test-sheets-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: 'Connected successfully! Google Sheets received and acknowledged the test payload.'
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: data.error || 'Connection failed. Ensure "Who has access" is set to "Anyone" in Apps Script deployment.'
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || 'Network error testing webhook.'
      });
    }
  };

  const handleSave = () => {
    AudioFX.playClick();
    onSaveConfig({
      title,
      instructions,
      timeLimit,
      passScorePercent: passScore,
      soundEnabled,
      requirePlayerEntry,
      sheetsConfig: {
        ...gameConfig.sheetsConfig,
        webhookUrl: webhookUrl.trim(),
        sheetName: sheetName.trim() || 'PlayerScores'
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0b12] border border-white/10 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Configuration & Google Sheets Integration
              </h3>
              <p className="text-xs text-white/50">
                Link standalone game exports directly to Google Sheets & configure game rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-white/10 bg-black/20 flex gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('game')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'game'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Game Rules & Entry</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'sheets' ? (
            <div className="space-y-5">
              {/* Webhook Input Card */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    <span>Google Apps Script Webhook URL</span>
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">Auto-Sync</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={testStatus?.loading}
                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-cyan-300 font-bold rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{testStatus?.loading ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                {testStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium border ${
                      testStatus.loading
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : testStatus.success
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {testStatus.message}
                  </div>
                )}

                <p className="text-[11px] text-white/50 leading-relaxed">
                  When configured, every player submission from the exported HTML game automatically appends a new row in your Google Sheet containing their <strong>Name, Email, Score, Accuracy, Time, and Identified Tells</strong>.
                </p>
              </div>

              {/* Step-by-Step Guide */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>How to connect your Google Sheet in 60 seconds:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                      Open Google Sheet
                    </div>
                    <p className="text-white/50">
                      Create or open a sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-cyan-400 underline">sheets.new</a>, then go to <strong>Extensions &rarr; Apps Script</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                      Paste Automation Code
                    </div>
                    <p className="text-white/50">
                      Copy the code below, replace the Apps Script file content with it, and click Save.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                      Deploy as Web App
                    </div>
                    <p className="text-white/50">
                      Click <strong>Deploy &rarr; New deployment &rarr; Web app</strong>. Set access to <strong>"Anyone"</strong> and paste URL here!
                    </p>
                  </div>
                </div>
              </div>

              {/* Ready-to-copy Google Apps Script Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white/60 uppercase tracking-wider text-[10px]">
                    Google Apps Script Code (Automatic Header & Row Appender)
                  </label>
                  <button
                    onClick={handleCopyScript}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60">
                  <pre className="p-3 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-48 leading-relaxed">
                    {scriptCode}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Game Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
                  Game Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none text-xs"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
                  Mission Instructions / Briefing Text
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-cyan-400 outline-none resize-none text-xs"
                />
              </div>

              {/* Time & Pass Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
                    Time Limit (Seconds, 0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-400 mb-1.5">
                    Pass Target Score (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value) || 70)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-cyan-400 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Require Player Entry Form Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" />
                    <span>Require Player Registration Entry Page</span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Displays Name and Email registration form prior to starting the game
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requirePlayerEntry}
                  onChange={(e) => setRequirePlayerEntry(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>

              {/* Audio Synth Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span>Web Audio Synth Effects</span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Sound feedback on hotspot clicks, answers, hints, and victory
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => {
                    setSoundEnabled(e.target.checked);
                    AudioFX.enabled = e.target.checked;
                  }}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
