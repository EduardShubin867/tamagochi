import { useEffect, useRef } from 'react';
import { RETRO_PALETTE } from './pixelMatrices';

interface PixelArtProps {
  map: string[];
  className?: string;
  label?: string;
}

export function PixelArt({ map, className = '', label }: PixelArtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(...map.map((row) => row.length));
    canvas.width = width;
    canvas.height = map.length;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, map.length);
    map.forEach((row, y) =>
      [...row].forEach((pixel, x) => {
        const color = RETRO_PALETTE[Number(pixel)];
        if (!color || color === 'transparent') return;
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }),
    );
  }, [map]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-art ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
