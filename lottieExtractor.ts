import lottie from 'lottie-web';

/**
 * 🚀 PRODUCTION-READY ARCHITECTURE: LOTTIE LAYER STRIPPER & RENDERER
 * 
 * Telegram NFT metadata (Fragment) provides a `.lottie.json` URL.
 * Inside this JSON, the 3D model, backdrop, and pattern are distinct layers.
 * 
 * This module fetches the raw Lottie JSON, programmatically strips out 
 * unwanted layers (e.g. removing backgrounds to isolate the 3D Model),
 * and renders the isolated first frame to a hidden HTMLCanvasElement.
 * It returns a clean base64 PNG data URL that can be cached and used in UI.
 */

export interface ParsedTraitMetadata {
  modelName: string;
  modelRarity: number;
  backdropName: string;
  backdropRarity: number;
  patternName: string;
  patternRarity: number;
  cleanModelPreviewUrl?: string; // The base64 PNG isolated by this script
}

export async function generateCleanPreview(
  lottieUrl: string, 
  trait: 'Model' | 'Symbol'
): Promise<string | null> {
  try {
    const res = await fetch(lottieUrl);
    const lottieData = await res.json();
    
    // 1. ISOLATE LAYERS (Lottie Layer Stripper)
    if (lottieData.layers && Array.isArray(lottieData.layers)) {
      lottieData.layers = lottieData.layers.filter((layer: any) => {
        const name = (layer.nm || '').toLowerCase();
        
        // Telegram Gift Layering Heuristics
        if (trait === 'Model') {
          // Exact match for the 3D Model layer in Telegram Gifts (usually named "Gift")
          return name.includes('gift') || name === 'model';
        } else if (trait === 'Symbol') {
          // Exact match for the Symbol/Pattern overlay
          return name.includes('pattern') || name.includes('symbol');
        }
        return false;
      });
    }
    
    // 2. HEADLESS RENDER TO CANVAS
    return new Promise((resolve) => {
      // Create a hidden container
      const container = document.createElement('div');
      container.style.width = '200px';
      container.style.height = '200px';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      
      const anim = lottie.loadAnimation({
        container,
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        animationData: lottieData,
      });
      
      // Wait for the DOM and first frame to be loaded
      anim.addEventListener('DOMLoaded', () => {
        anim.goToAndStop(0, true);
        
        // Slight delay to ensure canvas paint cycle is complete
        setTimeout(() => {
          const canvas = container.querySelector('canvas');
          if (canvas) {
            // Extract the transparent PNG
            const dataUrl = canvas.toDataURL('image/png');
            anim.destroy();
            document.body.removeChild(container);
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        }, 50);
      });
      
      anim.addEventListener('data_failed', () => {
        document.body.removeChild(container);
        resolve(null);
      });
    });
  } catch (e) {
    console.error("Error extracting Lottie", e);
    return null;
  }
}
