import React, { useState } from 'react';

interface PremiumImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const PremiumImage: React.FC<PremiumImageProps> = ({ src, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {/* Shimmer effect while loading or if error */}
      {(!loaded || error) && (
        <div className="absolute inset-0 bg-white/5 rounded-inherit">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
      
      {!error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-contain transition-opacity duration-500 relative z-10 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};
