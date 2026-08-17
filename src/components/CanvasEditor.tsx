import React, { useRef, useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Eye, 
  EyeOff, 
  Menu
} from 'lucide-react';
import { Challenge, Hotspot } from '../types';
import { AudioFX } from '../utils/audio';

interface CanvasEditorProps {
  challenge: Challenge;
  selectedHotspotId: string | null;
  onSelectHotspot: (id: string | null) => void;
  onAddHotspot: (x: number, y: number) => void;
  onUpdateHotspotCoords: (id: string, x: number, y: number) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  challenge,
  selectedHotspotId,
  onSelectHotspot,
  onAddHotspot,
  onUpdateHotspotCoords,
  onToggleSidebar,
  isSidebarOpen
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showRadii, setShowRadii] = useState<boolean>(true);
  const [draggedPinId, setDraggedPinId] = useState<string | null>(null);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Zoom handlers
  const handleZoomChange = (delta: number) => {
    setZoom((prev) => Math.max(0.4, Math.min(3.5, Number((prev + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Wheel zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoom((prev) => Math.max(0.4, Math.min(3.5, Number((prev + delta).toFixed(2)))));
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  // Global mouse move and up for dragging pins
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedPinId || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      let px = e.clientX - rect.left;
      let py = e.clientY - rect.top;

      px = Math.max(0, Math.min(rect.width, px));
      py = Math.max(0, Math.min(rect.height, py));

      const pctX = Math.round((px / rect.width) * 100);
      const pctY = Math.round((py / rect.height) * 100);

      onUpdateHotspotCoords(draggedPinId, pctX, pctY);
    };

    const handleMouseUp = () => {
      if (draggedPinId) {
        setDraggedPinId(null);
      }
    };

    if (draggedPinId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPinId, onUpdateHotspotCoords]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.pin-marker')) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    setIsPanning(true);
    setHasMoved(false);
    setStartPos({ x: e.pageX - viewport.offsetLeft, y: e.pageY - viewport.offsetTop });
    setScrollPos({ left: viewport.scrollLeft, top: viewport.scrollTop });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !viewportRef.current) return;
    const x = e.pageX - viewportRef.current.offsetLeft;
    const y = e.pageY - viewportRef.current.offsetTop;
    const walkX = x - startPos.x;
    const walkY = y - startPos.y;

    if (Math.abs(walkX) > 4 || Math.abs(walkY) > 4) {
      setHasMoved(true);
    }

    viewportRef.current.scrollLeft = scrollPos.left - walkX;
    viewportRef.current.scrollTop = scrollPos.top - walkY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setIsPanning(false);

    // If it was a clean click on the image (not dragged), add a hotspot
    if (!hasMoved && imageRef.current && (e.target as HTMLElement).closest('#builder-image-wrapper')) {
      const rect = imageRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (px >= 0 && px <= rect.width && py >= 0 && py <= rect.height) {
        const pctX = Math.round((px / rect.width) * 100);
        const pctY = Math.round((py / rect.height) * 100);
        onAddHotspot(pctX, pctY);
      }
    }
  };

  return (
    <section className="flex-1 flex flex-col relative overflow-hidden bg-[#050508]">
      {/* Top Controls Toolbar */}
      <div className="h-12 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 flex items-center justify-between shrink-0 text-xs text-white/60 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSidebarOpen
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
            }`}
            title="Toggle Cases Sidebar"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cases</span>
          </button>

          <span className="flex items-center gap-1.5 text-white/90 font-medium bg-white/5 px-3 py-1 rounded-xl border border-white/5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click Canvas to Add Tell</span>
          </span>

          <span className="hidden lg:inline text-white/40 text-[11px] font-mono">| Drag pins to reposition coordinates</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/5 px-2 py-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleZoomChange(-0.25)}
              className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono text-[11px] font-bold text-cyan-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoomChange(0.25)}
              className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-white/40 hover:text-white ml-1 pl-1.5 border-l border-white/10 transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Toggle Hit Areas */}
          <button
            onClick={() => setShowRadii(!showRadii)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showRadii
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
            }`}
          >
            {showRadii ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Hit Radii</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        ref={viewportRef}
        className={`viewport ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPanning(false)}
      >
        <div className="canvas-stage">
          <div
            id="builder-image-wrapper"
            className="image-wrapper cursor-crosshair relative"
            style={{ width: `${800 * zoom}px` }}
          >
            <img
              ref={imageRef}
              src={challenge.imageUrl}
              alt={challenge.title}
              className="w-full block select-none pointer-events-none"
              draggable={false}
            />

            {/* Hotspots Layer */}
            <div className="hotspot-layer">
              {challenge.hotspots.map((hs, idx) => {
                const isSelected = hs.id === selectedHotspotId;
                return (
                  <React.Fragment key={hs.id}>
                    {/* Radius Circle */}
                    {showRadii && (
                      <div
                        style={{
                          left: `${hs.x}%`,
                          top: `${hs.y}%`,
                          width: `${hs.radius * 2}%`,
                          aspectRatio: '1/1'
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all pointer-events-none ${
                          isSelected
                            ? 'border-teal-400 bg-teal-500/25 z-10 shadow-lg shadow-teal-500/20'
                            : 'border-indigo-400/50 bg-indigo-500/10 z-0'
                        }`}
                      />
                    )}

                    {/* Pin Marker */}
                    <div
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedPinId(hs.id);
                        onSelectHotspot(hs.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        AudioFX.playClick();
                        onSelectHotspot(hs.id);
                      }}
                      className={`pin-marker select-none ${
                        isSelected
                          ? 'pin-selected'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                      title={hs.title}
                    >
                      {idx + 1}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
