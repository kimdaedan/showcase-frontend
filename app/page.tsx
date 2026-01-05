'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';

export default function HomePage() {
  // --- STATE UNTUK VIDEO YOUTUBE ---
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  // ID Video Youtube
  const YOUTUBE_VIDEO_ID = "W1DwJvEOid8?si=ioh-n0GJ_oA3j9du";

  // --- STATE TYPING EFFECT ---
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const phrases = ["Pameran Mahasiswa", "Inovasi Teknologi", "Kreativitas Seni", "Solusi Masa Depan"];

  // Logika Typing Effect
  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];

      setDisplayText(isDeleting
        ? fullText.substring(0, displayText.length - 1)
        : fullText.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 150);

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, phrases, typingSpeed]);

  return (
    <main className="flex min-h-screen flex-col font-sans relative overflow-hidden text-gray-800">
      <Navbar />

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background Future"
          fill
          priority
          className="object-cover scale-105 animate-slow-zoom"
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-blue-900/40 backdrop-blur-[2px]"></div>
      </div>

      {/* --- DEKORASI --- */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>


      {/* --- KONTEN UTAMA --- */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-20">

        <div className="bg-white/80 backdrop-blur-md border border-white/50 max-w-5xl w-full p-8 md:p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col md:flex-row items-center gap-10 transform transition-all hover:scale-[1.01]">

          {/* Bagian Kiri: Teks */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              Virtual Exhibition 2025
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Platform Karya <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {displayText}
              </span>
              <span className="animate-pulse text-blue-600">|</span>
            </h1>

            <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-lg">
              Jelajahi inovasi mahasiswa Politeknik Negeri Batam. Upload, kelola, dan pamerkan karya terbaikmu kepada dunia dalam galeri 3D interaktif.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
              <Link
                href="/exhibition"
                className="group relative px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden"
              >
                <span className="relative z-10">JELAJAHI PAMERAN</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
              </Link>

              <Link
                href="/upload"
                className="px-8 py-4 bg-white text-gray-700 font-bold border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-1 text-center shadow-sm"
              >
                UPLOAD KARYA
              </Link>
            </div>

            <div className="flex items-center gap-4 justify-center md:justify-start pt-6 text-sm text-gray-500 font-medium">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs overflow-hidden">
                       <Image src={`/future.jpg`} alt="user" width={32} height={32} className="object-cover w-full h-full opacity-60"/>
                    </div>
                 ))}
               </div>
               <p>Bergabung dengan 150+ Mahasiswa Kreatif</p>
            </div>
          </div>

          {/* Bagian Kanan: Ilustrasi & Video Trigger */}
          <div className="flex-1 w-full relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
             <Image
               src="/future.jpg"
               alt="Showcase Preview"
               fill
               className="object-cover transition-transform duration-700 group-hover:scale-110"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                   <p className="font-bold text-lg">Virtual Booth 3D</p>
                   <p className="text-xs text-gray-300">Pengalaman pameran imersif</p>
                </div>
             </div>

             {/* TOMBOL PLAY (INTERAKTIF) */}
             <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                <button
                  onClick={() => setIsVideoOpen(true)}
                  className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 cursor-pointer hover:bg-blue-600 hover:border-blue-600 hover:scale-110 transition-all duration-300 group-hover:animate-pulse"
                >
                   <svg className="w-8 h-8 text-white fill-current pl-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* --- MODAL VIDEO YOUTUBE --- */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">

          {/* Tombol Close di Luar */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsVideoOpen(false)}></div>

          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 z-10">
            {/* Tombol Close (X) */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500 bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Iframe YouTube */}
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
              title="YouTube video player"
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* --- FOOTER (Tetap dengan Logo PNG) --- */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 py-6 px-8 relative z-20 text-gray-600 text-sm font-medium">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Logo Kiri */}
          <div className="flex justify-center md:justify-start">
             <Image
                src="/logo.png" // Menggunakan logo.png sesuai permintaan
                alt="Logo Footer"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
              />
          </div>

          {/* Copyright Tengah */}
          <div className="text-center">
            © 2025 Politeknik Negeri Batam.
          </div>

          {/* Link Kanan */}
          <div className="flex justify-center md:justify-end gap-4">
             <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* --- CSS Animations --- */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate linear; }
        @keyframes shine { 100% { left: 125%; } }
        .animate-shine { animation: shine 1s; }
      `}</style>
    </main>
  );
}