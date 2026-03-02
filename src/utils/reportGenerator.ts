import type { PredictResponse } from '../lib/api';
import QRCode from 'qrcode';

interface GenerateReportOptions {
  originalImage: string; // base64
  prediction: PredictResponse;
  mapSnapshot?: string; // base64 map image
}

// Safari compatibility: roundRect polyfill
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  // Use native roundRect if available (modern browsers), fallback to rect for older Safari
  const ctxWithRoundRect = ctx as CanvasRenderingContext2D & {
    roundRect?: (x: number, y: number, w: number, h: number, r: number) => void;
  };
  
  if (typeof ctxWithRoundRect.roundRect === 'function') {
    ctxWithRoundRect.roundRect(x, y, width, height, radius);
  } else {
    // Fallback: draw a standard rectangle (older Safari)
    ctx.rect(x, y, width, height);
  }
}

// Helper: Load image from URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 50)}...`));
    img.src = src;
  });
}

// Helper: Convert canvas to blob
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate blob'));
    }, 'image/png');
  });
}

/**
 * Generate a shareable report image (PNG) with prediction results.
 * Creates a 1200x630px image optimized for social sharing.
 */
export async function generateShareableReport(
  options: GenerateReportOptions
): Promise<Blob> {
  const { originalImage, prediction, mapSnapshot } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 630);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#0f0f1e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Grid pattern overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1200; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 630);
    ctx.stroke();
  }
  for (let i = 0; i < 630; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1200, i);
    ctx.stroke();
  }

  // Load and draw original image
  const img = await loadImage(originalImage);
  
  // Draw original image (left side)
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 30, 30, 550, 400, 12);
  ctx.clip();
  ctx.drawImage(img, 30, 30, 550, 400);
  ctx.restore();

  // Add border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRect(ctx, 30, 30, 550, 400, 12);
  ctx.stroke();

  // Draw map or info panel (right side)
  if (mapSnapshot) {
    const mapImg = await loadImage(mapSnapshot);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 620, 30, 550, 400, 12);
    ctx.clip();
    ctx.drawImage(mapImg, 620, 30, 550, 400);
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    roundRect(ctx, 620, 30, 550, 400, 12);
    ctx.stroke();
    
    drawInfoPanel(ctx, prediction);
  } else {
    // Draw info panel instead of map
    drawInfoPanelFallback(ctx, prediction);
  }
  
  await drawFooter(ctx, prediction);
  
  return canvasToBlob(canvas);
}

function drawInfoPanel(ctx: CanvasRenderingContext2D, prediction: PredictResponse) {
  const x = 620;
  const y = 460;

  // Location coords
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText('Predicted Location', x, y);

  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#a0a0a0';
  ctx.fillText(
    `${prediction.location.lat.toFixed(4)}, ${prediction.location.lon.toFixed(4)}`,
    x,
    y + 32
  );

  // Confidence
  const confidencePercent = Math.round(prediction.confidence * 100);
  const confidenceColor = confidencePercent >= 75 ? '#22c55e' : 
                          confidencePercent >= 60 ? '#eab308' : '#ef4444';
  
  ctx.fillStyle = confidenceColor;
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.fillText(`Confidence: ${confidencePercent}%`, x, y + 72);

  // Radius
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '16px Inter, system-ui, sans-serif';
  const radiusKm = Math.round(prediction.location.radius_m / 1000);
  ctx.fillText(`Accuracy radius: ~${radiusKm}km`, x, y + 100);
}

function drawInfoPanelFallback(ctx: CanvasRenderingContext2D, prediction: PredictResponse) {
  const x = 620;
  const y = 100;

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.fillText('GeoWraith', x, y);
  
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '18px Inter, system-ui, sans-serif';
  ctx.fillText('Visual Geolocation System', x, y + 28);

  // Location
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.fillText('Predicted Location', x, y + 80);

  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#a0a0a0';
  ctx.fillText(
    `${prediction.location.lat.toFixed(4)}, ${prediction.location.lon.toFixed(4)}`,
    x,
    y + 112
  );

  // Confidence
  const confidencePercent = Math.round(prediction.confidence * 100);
  const confidenceColor = confidencePercent >= 75 ? '#22c55e' : 
                          confidencePercent >= 60 ? '#eab308' : '#ef4444';
  
  ctx.fillStyle = confidenceColor;
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.fillText(`${confidencePercent}% Confidence`, x, y + 160);

  // Scene context
  if (prediction.scene_context) {
    ctx.fillStyle = '#666';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(
      `Scene: ${prediction.scene_context.scene_type} | ${prediction.scene_context.cohort_hint}`,
      x,
      y + 200
    );
  }
}

async function drawFooter(ctx: CanvasRenderingContext2D, prediction: PredictResponse) {
  // Footer line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 580);
  ctx.lineTo(1170, 580);
  ctx.stroke();

  // Generate and draw QR code
  await drawQRCode(ctx, prediction);

  // Logo/brand
  ctx.fillStyle = '#666';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText('Generated by GeoWraith', 30, 610);

  // Request ID
  ctx.fillStyle = '#444';
  ctx.font = '12px monospace';
  const requestId = prediction.request_id ?? 'unknown';
  ctx.fillText(`ID: ${requestId.slice(0, 16)}...`, 300, 610);

  // Timestamp
  const timestamp = new Date().toLocaleString();
  ctx.fillText(timestamp, 900, 610);
}

async function drawQRCode(ctx: CanvasRenderingContext2D, prediction: PredictResponse) {
  const qrSize = 80;
  const qrX = 1060;
  const qrY = 485;
  
  try {
    // Generate QR code data URL
    const reportUrl = `https://geowraith.com/p/${prediction.request_id ?? 'report'}`;
    const qrDataUrl = await QRCode.toDataURL(reportUrl, {
      width: qrSize,
      margin: 1,
      color: {
        dark: '#ffffff',
        light: '#00000000' // Transparent background
      }
    });
    
    // Load and draw QR code
    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject(new Error('Failed to load QR code'));
      qrImg.src = qrDataUrl;
    });
    
    // Draw white background for QR
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    roundRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4);
    ctx.fill();
    
    // Draw QR code
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    
    // Label
    ctx.fillStyle = '#888';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText('Scan to view', qrX + 10, qrY + qrSize + 18);
    
  } catch (err) {
    // Fallback: draw placeholder if QR generation fails
    console.warn('[Report] QR generation failed:', err);
    ctx.fillStyle = '#444';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = '#666';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('QR unavailable', qrX + 5, qrY + 45);
  }
}

/**
 * Download a report blob as a file.
 */
export function downloadReport(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
