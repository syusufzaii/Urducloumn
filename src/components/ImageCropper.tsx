import React, { useRef, useState, useEffect } from "react";
import { ZoomIn, RotateCw, Check, X, Move, Sparkles } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // degrees: 0, 90, 180, 270
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load image
  useEffect(() => {
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setLoading(false);
      // Reset controls for new image
      setZoom(1.0);
      setRotation(0);
      setOffsetX(0);
      setOffsetY(0);
    };
    img.onerror = () => {
      console.error("Failed to load image for cropping");
      setLoading(false);
    };
  }, [imageSrc]);

  // Draw on canvas whenever params change
  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300; // Output crop resolution (300x300 pixels)
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#1e1b18"; // Dark background to fill outer areas if any
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    // Translate to center of canvas
    ctx.translate(size / 2, size / 2);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply zoom
    ctx.scale(zoom, zoom);

    // Calculate base scale to cover the canvas (cover fit)
    const drawWidth = imgElement.width;
    const drawHeight = imgElement.height;
    
    // Depending on rotation, check swapped dimensions
    const isRotated90or270 = rotation % 180 !== 0;
    const wRef = isRotated90or270 ? drawHeight : drawWidth;
    const hRef = isRotated90or270 ? drawWidth : drawHeight;

    const baseScale = Math.max(size / wRef, size / hRef);
    const w = drawWidth * baseScale;
    const h = drawHeight * baseScale;

    // Draw centered with user drag offsets
    // Compensate offsets for rotation
    let tx = offsetX;
    let ty = offsetY;
    if (rotation === 90) {
      tx = offsetY;
      ty = -offsetX;
    } else if (rotation === 180) {
      tx = -offsetX;
      ty = -offsetY;
    } else if (rotation === 270) {
      tx = -offsetY;
      ty = offsetX;
    }

    ctx.drawImage(imgElement, -w / 2 + tx, -h / 2 + ty, w, h);
    ctx.restore();
  }, [imgElement, zoom, rotation, offsetX, offsetY]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffsetX((prev) => prev + dx / zoom);
    setOffsetY((prev) => prev + dy / zoom);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setOffsetX((prev) => prev + dx / zoom);
    setOffsetY((prev) => prev + dy / zoom);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const croppedDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
    onCrop(croppedDataUrl);
  };

  return (
    <div className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl border border-stone-800 p-6 max-w-md w-full mx-auto shadow-2xl font-sans" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-brand-gold font-urdu flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>پروفائل تصویر ایڈٹ کریں</span>
          </h3>
          <p className="text-[10px] text-stone-400 font-urdu mt-0.5">تصویر کو فریم کے مطابق ایڈجسٹ کریں</p>
        </div>
        <button
          onClick={onCancel}
          className="text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Main */}
      <div className="flex flex-col items-center gap-6 py-4">
        {loading ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center bg-stone-800 rounded-full border-4 border-dashed border-stone-700 animate-pulse text-xs text-stone-400">
            لوڈنگ ہو رہی ہے...
          </div>
        ) : (
          <div className="relative group cursor-move">
            {/* Round Avatar Mask View (matches thumbnail) */}
            <div className="rounded-full overflow-hidden border-4 border-brand-gold shadow-lg w-[200px] h-[200px] relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            </div>
            {/* Drag guide overlay */}
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="bg-black/60 text-[10px] px-2 py-1 rounded-full flex items-center gap-1 text-white font-urdu">
                <Move className="w-3 h-3 text-brand-gold" /> تصویر گھسیٹ کر فٹ کریں
              </span>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <div className="w-full space-y-4">
          {/* Zoom Control */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-stone-300 font-urdu">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-brand-gold" />
                <span>سائز بڑا کریں (Zoom):</span>
              </span>
              <span className="font-mono">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-brand-gold h-1 bg-stone-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Position offsets sliders as easy alternate controls */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <span className="block text-[10px] text-stone-400 font-urdu text-right">افقی پوزیشن (Move X)</span>
              <input
                type="range"
                min="-150"
                max="150"
                step="2"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="w-full accent-brand-gold h-1 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-stone-400 font-urdu text-right">عمودی پوزیشن (Move Y)</span>
              <input
                type="range"
                min="-150"
                max="150"
                step="2"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="w-full accent-brand-gold h-1 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Rotate Control */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRotate}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-urdu"
            >
              <RotateCw className="w-3.5 h-3.5 text-brand-gold" />
              <span>تصویر گھمائیں (Rotate 90°)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="border-t border-stone-800 pt-4 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer font-urdu"
        >
          منسوخ کریں
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-brand-gold hover:bg-amber-500 text-stone-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5 font-urdu"
        >
          <Check className="w-4 h-4" />
          <span>لاگو کریں (Crop & Save)</span>
        </button>
      </div>
    </div>
  );
}
