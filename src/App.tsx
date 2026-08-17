/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveView, Challenge, GameConfig, Hotspot } from './types';
import { initialGameConfig } from './data/defaultChallenges';
import { Header } from './components/Header';
import { ChallengeSidebar } from './components/ChallengeSidebar';
import { CanvasEditor } from './components/CanvasEditor';
import { Inspector } from './components/Inspector';
import { PlaytestView } from './components/PlaytestView';
import { ScoresView } from './components/ScoresView';
import { SettingsModal } from './components/SettingsModal';
import { generateStandaloneGameHtml } from './utils/exportHtml';
import { AudioFX } from './utils/audio';

export default function App() {
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('ai_tell_studio_config_v52');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return initialGameConfig;
  });

  const [activeView, setActiveView] = useState<ActiveView>('builder');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recordedCount, setRecordedCount] = useState(0);

  // Sync audio enabled
  useEffect(() => {
    AudioFX.enabled = gameConfig.soundEnabled;
  }, [gameConfig.soundEnabled]);

  // Persist game config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_tell_studio_config_v52', JSON.stringify(gameConfig));
    } catch (e) {
      // ignore storage quota error for large base64
    }
  }, [gameConfig]);

  // Fetch recorded scores count
  const fetchScoresCount = async () => {
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === 'number') {
          setRecordedCount(data.count);
        }
      }
    } catch (e) {
      // Backend api offline or preview
    }
  };

  useEffect(() => {
    fetchScoresCount();
  }, [activeView]);

  const currentChallenge = gameConfig.challenges[currentChallengeIndex] || gameConfig.challenges[0];
  const selectedHotspot = currentChallenge ? currentChallenge.hotspots.find(h => h.id === selectedHotspotId) || null : null;
  const selectedHotspotIndex = currentChallenge && selectedHotspot ? currentChallenge.hotspots.findIndex(h => h.id === selectedHotspot.id) + 1 : 0;

  // Challenge modifications
  const handleSelectChallenge = (index: number) => {
    setCurrentChallengeIndex(index);
    setSelectedHotspotId(null);
  };

  const handleAddChallenge = (newChallenge: Challenge) => {
    setGameConfig(prev => ({
      ...prev,
      challenges: [...prev.challenges, newChallenge]
    }));
    setCurrentChallengeIndex(gameConfig.challenges.length);
    setSelectedHotspotId(null);
  };

  const handleDeleteChallenge = (index: number) => {
    if (gameConfig.challenges.length <= 1) return;
    setGameConfig(prev => {
      const updated = prev.challenges.filter((_, i) => i !== index);
      return { ...prev, challenges: updated };
    });
    setCurrentChallengeIndex(Math.max(0, index - 1));
    setSelectedHotspotId(null);
  };

  const handleUpdateChallengeImage = (index: number, imageUrl: string) => {
    setGameConfig(prev => {
      const updated = [...prev.challenges];
      if (updated[index]) {
        updated[index] = { ...updated[index], imageUrl };
      }
      return { ...prev, challenges: updated };
    });
  };

  // Hotspot modifications
  const handleAddHotspot = (x: number, y: number) => {
    AudioFX.playClick();
    const newId = 'hs-' + Date.now();
    const newHotspot: Hotspot = {
      id: newId,
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
      radius: 8,
      title: `AI Artifact Tell #${(currentChallenge?.hotspots.length || 0) + 1}`,
      category: 'Anatomy',
      keywords: ['flaw', 'artifact', 'error'],
      hint: 'Inspect this region for anatomical or structural errors.',
      explanation: 'AI generative diffusion artifact in this region.',
      points: 100
    };

    setGameConfig(prev => {
      const updatedChallenges = [...prev.challenges];
      if (updatedChallenges[currentChallengeIndex]) {
        updatedChallenges[currentChallengeIndex] = {
          ...updatedChallenges[currentChallengeIndex],
          hotspots: [...updatedChallenges[currentChallengeIndex].hotspots, newHotspot]
        };
      }
      return { ...prev, challenges: updatedChallenges };
    });

    setSelectedHotspotId(newId);
  };

  const handleUpdateHotspot = (updatedProps: Partial<Hotspot>) => {
    if (!selectedHotspotId) return;
    setGameConfig(prev => {
      const updatedChallenges = [...prev.challenges];
      const chal = updatedChallenges[currentChallengeIndex];
      if (chal) {
        chal.hotspots = chal.hotspots.map(h => {
          if (h.id === selectedHotspotId) {
            return { ...h, ...updatedProps };
          }
          return h;
        });
      }
      return { ...prev, challenges: updatedChallenges };
    });
  };

  const handleUpdateHotspotCoords = (id: string, x: number, y: number) => {
    setGameConfig(prev => {
      const updatedChallenges = [...prev.challenges];
      const chal = updatedChallenges[currentChallengeIndex];
      if (chal) {
        chal.hotspots = chal.hotspots.map(h => {
          if (h.id === id) {
            return { ...h, x, y };
          }
          return h;
        });
      }
      return { ...prev, challenges: updatedChallenges };
    });
  };

  const handleDeleteHotspot = (id: string) => {
    setGameConfig(prev => {
      const updatedChallenges = [...prev.challenges];
      const chal = updatedChallenges[currentChallengeIndex];
      if (chal) {
        chal.hotspots = chal.hotspots.filter(h => h.id !== id);
      }
      return { ...prev, challenges: updatedChallenges };
    });
    setSelectedHotspotId(null);
  };

  // Export standalone HTML file
  const handleExportHTML = () => {
    AudioFX.playClick();
    const htmlContent = generateStandaloneGameHtml(gameConfig);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gameConfig.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_game.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveConfig = (updated: Partial<GameConfig>) => {
    setGameConfig(prev => ({ ...prev, ...updated }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#050508] text-[#E0E0E6] font-sans select-none relative">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-blue-600 blur-[130px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-900 blur-[150px]" />
        <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] rounded-full bg-cyan-500/20 blur-[140px]" />
      </div>

      {/* Top Application Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        gameConfig={gameConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportHTML={handleExportHTML}
        recordedCount={recordedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {activeView === 'builder' && (
          <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
            {/* Left Challenge / Image Selector */}
            <ChallengeSidebar
              challenges={gameConfig.challenges}
              currentChallengeIndex={currentChallengeIndex}
              onSelectChallenge={handleSelectChallenge}
              onAddChallenge={handleAddChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onUpdateChallengeImage={handleUpdateChallengeImage}
              isOpen={isSidebarOpen}
            />

            {/* Center Canvas Viewport */}
            {currentChallenge && (
              <CanvasEditor
                challenge={currentChallenge}
                selectedHotspotId={selectedHotspotId}
                onSelectHotspot={setSelectedHotspotId}
                onAddHotspot={handleAddHotspot}
                onUpdateHotspotCoords={handleUpdateHotspotCoords}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
              />
            )}

            {/* Right Hotspot Property Inspector */}
            <Inspector
              hotspot={selectedHotspot}
              hotspotIndex={selectedHotspotIndex}
              onUpdateHotspot={handleUpdateHotspot}
              onDeleteHotspot={handleDeleteHotspot}
              onDeselect={() => setSelectedHotspotId(null)}
            />
          </div>
        )}

        {activeView === 'playtest' && (
          <PlaytestView
            gameConfig={gameConfig}
            onRecordCompleted={fetchScoresCount}
            onBackToBuilder={() => setActiveView('builder')}
          />
        )}

        {activeView === 'scores' && (
          <ScoresView
            gameConfig={gameConfig}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onBackToBuilder={() => setActiveView('builder')}
          />
        )}
      </main>

      {/* Settings Modal (Game Rules & Google Sheets Sync Hub) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameConfig={gameConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
