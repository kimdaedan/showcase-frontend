'use client';

import { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // ID dari URL YouTube Shorts: https://www.youtube.com/shorts/hdHnmDIfCyg
  const VIDEO_ID = "hdHnmDIfCyg";

  // Durasi animasi sebelum otomatis masuk ke home (dalam milidetik)
  // Video tersebut durasinya sekitar 8 detik, jadi kita set 8000ms
  const DURATION_MS = 13000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, DURATION_MS);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="relative w-full h-full">
        {/* Overlay transparan agar user tidak bisa klik pause/stop video */}
        <div className="absolute inset-0 z-10 bg-transparent" />

        {/* Tombol Skip untuk user yang ingin melewati intro */}
        <button
          onClick={onFinish}
          className="absolute bottom-10 right-10 z-20 text-white border border-white/30 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all backdrop-blur-sm"
        >
          Skip Intro
        </button>

        {/* Parameter URL Penjelasan:
            - autoplay=1: Putar otomatis
            - mute=1: Wajib di-mute agar autoplay jalan di Chrome/Safari
            - controls=0: Hilangkan tombol play/pause
            - loop=1 & playlist=ID: Agar video berulang (looping)
            - playsinline=1: Agar tidak fullscreen otomatis di iOS
        */}
        <iframe
          src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${VIDEO_ID}&playsinline=1`}
          title="Intro Animation"
          className="w-full h-full object-cover pointer-events-none scale-110" // scale-110 untuk menghilangkan garis hitam tipis jika ada
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
}