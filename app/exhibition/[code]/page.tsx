'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Scene3D from '../../../components/Scene3D';
import { Suspense, useEffect, useState, useCallback } from 'react';

// Tipe Data Project & Comment
type Project = {
  id: number;
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  karya_type: 'IMAGE' | 'PDF' | 'YOUTUBE';
  karya_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  major?: string;
  prodi?: string;
};

type Comment = {
  id: number;
  user_name: string;
  comment: string;
  rating: number;
  created_at: string;
};

export default function ProdiDetailPage() {
  const params = useParams();
  const code = typeof params.code === 'string' ? params.code.toLowerCase() : '';
  const isInformatika = code === 'if';

  // --- STATE DATA ---
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  // --- STATE INTERAKSI ---
  const [hoverInfo, setHoverInfo] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // --- STATE KOMENTAR & USER ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ name: '', text: '', rating: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mapping Nama Prodi
  const prodiNameMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika", trm: "D4 Tek. Rekayasa Multimedia", cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi", rpl: "D4 Rekayasa Perangkat Lunak", elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika", ak: "D3 Akuntansi"
  };
  const title = prodiNameMap[code] || "Detail Program Studi";
  const targetProdi = prodiNameMap[code];

  // --- 1. CEK LOGIN & AMBIL NAMA ---
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setIsLoggedIn(true);
      setNewComment((prev) => ({ ...prev, name: storedName }));
    }
  }, []);

  // --- 2. FETCH PROJECTS ---
  useEffect(() => {
    if (!targetProdi) return;
    const fetchApprovedProject = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/projects');
        const data = await res.json();

        const approvedList = data.filter((p: Project) =>
          p.status === 'APPROVED' &&
          p.karya_type === 'IMAGE' &&
          p.prodi === targetProdi
        );

        if (approvedList.length > 0) {
          setProjectsList(approvedList);
          const urls = approvedList.slice(0, 2).map((p: Project) =>
            `http://localhost:5000/${p.karya_url}`
          );
          setProjectImages(urls);
          setDisplayProject(approvedList[0]);
        } else {
          setProjectsList([]); setProjectImages([]); setDisplayProject(null);
        }
      } catch (err) { console.error(err); }
    };
    fetchApprovedProject();
  }, [code, targetProdi]);

  // --- 3. FETCH KOMENTAR ---
  const fetchComments = async (projectId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${projectId}`);
      const data = await res.json();
      setComments(data);
    } catch (err) { console.error("Gagal ambil komentar:", err); }
  };

  // --- 4. SUBMIT KOMENTAR ---
  const handleSubmitComment = async () => {
    if (!displayProject) return;
    if (!newComment.name) { alert("Mohon isi nama Anda."); return; }
    if (!newComment.text || newComment.rating === 0) { alert("Mohon isi komentar dan rating!"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: displayProject.id,
          user_name: newComment.name,
          comment: newComment.text,
          rating: newComment.rating
        })
      });

      if (res.ok) {
        setNewComment(prev => ({ ...prev, text: '', rating: 0, name: isLoggedIn ? prev.name : '' }));
        fetchComments(displayProject.id);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) { console.error(err); alert("Gagal mengirim komentar."); }
    finally { setIsSubmitting(false); }
  };

  const handleHoverScreen = useCallback((isHovering: boolean, x: number, y: number, index: number) => {
    setHoverInfo((prev) => {
      if (prev.show === isHovering && prev.x === x && prev.y === y) return prev;
      if (isHovering) return { show: true, x, y };
      return prev.show ? { show: false, x: 0, y: 0 } : prev;
    });
  }, []);

  const handleClickScreen = useCallback((index: number) => {
    const selectedProject = projectsList[index];
    if (selectedProject) {
      setDisplayProject(selectedProject);
      fetchComments(selectedProject.id);
      setShowPreviewPopup(true);
    }
  }, [projectsList]);

  return (
    <main className="flex min-h-screen flex-col font-sans relative overflow-hidden">

      {/* 1. BACKGROUND FUTURISTIK */}
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" quality={100} priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-gray-900/90"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Tombol Kembali (Floating) */}
        <Link href="/exhibition" className="fixed top-24 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2 group">
           <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali
        </Link>

        <div className="flex-grow px-4 py-8 flex justify-center items-center">

          {/* CONTAINER UTAMA GLASSMORPHISM */}
          <div className="w-full max-w-7xl bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-[85vh]">

            {/* Header Prodi */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/40 to-transparent">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-md">{title}</h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/50 text-blue-200 text-xs font-bold rounded">KODE: {code.toUpperCase()}</span>
                   <span className="text-gray-400 text-xs">• Virtual Exhibition Hall</span>
                </div>
              </div>
            </div>

            {/* Area 3D */}
            <div className="flex-grow p-4 relative bg-gray-900/50">
              {isInformatika ? (
                <div className="flex flex-col h-full rounded-xl overflow-hidden border border-white/10 relative shadow-inner">

                   {/* Instruksi Overlay */}
                   <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
                      <span className="text-xs text-gray-300 font-medium">🎮 Navigasi: <b>WASD</b> (Gerak) • <b>Mouse</b> (Lihat) • <b>Klik Layar</b> (Detail)</span>
                   </div>

                   <div className="flex-grow w-full h-full">
                    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white font-bold animate-pulse">Memuat Pameran 3D...</div>}>
                      <Scene3D modelUrl="/models/booth_a.glb" images={projectImages} onHoverScreen={handleHoverScreen} onClickScreen={handleClickScreen} />
                    </Suspense>
                   </div>

                   {/* Tooltip Hover */}
                   {hoverInfo.show && (
                      <div className="fixed pointer-events-none z-50 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)] transform -translate-x-1/2 -translate-y-full mt-[-15px]" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
                        👆 Klik untuk Lihat Karya
                      </div>
                   )}

                   {/* Popup Preview Cepat */}
                   {showPreviewPopup && displayProject && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative">
                          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{displayProject.title}</h3>
                          <p className="text-gray-500 text-sm mb-6 line-clamp-2">{displayProject.description}</p>
                          <div className="flex flex-col gap-3">
                            <button onClick={() => { setShowPreviewPopup(false); setShowDetailModal(true); }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">Buka Detail Lengkap</button>
                            <button onClick={() => setShowPreviewPopup(false)} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Tutup</button>
                          </div>
                        </div>
                      </div>
                   )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                   <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">🚧</div>
                   <p className="text-gray-400 font-light">Booth 3D untuk prodi ini sedang dalam pembangunan.</p>
                </div>
              )}
            </div>

            {/* --- MODAL DETAIL FULL SCREEN --- */}
            {showDetailModal && displayProject && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">

                {/* Toast Sukses */}
                {showSuccessToast && (
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[110] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
                    <span className="text-xl">✅</span><span className="font-bold">Ulasan Terkirim!</span>
                  </div>
                )}

                <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">

                  {/* KIRI: DETAIL KARYA */}
                  <div className="md:w-3/5 p-8 overflow-y-auto bg-gray-50 custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{displayProject.title}</h2>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 font-medium">
                           <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Ketua Tim</span>
                           <span>{displayProject.nama_ketua} ({displayProject.nim_ketua})</span>
                        </div>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="md:hidden text-gray-400 text-3xl">&times;</button>
                    </div>

                    <div className="aspect-video relative rounded-xl overflow-hidden border border-gray-200 shadow-lg mb-8 bg-black group">
                      <Image src={`http://localhost:5000/${displayProject.karya_url}`} alt="Karya" fill className="object-contain group-hover:scale-105 transition-transform duration-700" unoptimized />
                    </div>

                    <div className="prose max-w-none">
                       <h4 className="font-bold text-gray-900 text-lg mb-2">Tentang Karya</h4>
                       <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-line">{displayProject.description}</p>
                    </div>
                  </div>

                  {/* KANAN: KOMENTAR & FORM */}
                  <div className="md:w-2/5 bg-white border-l border-gray-200 flex flex-col h-full">

                    {/* Header Komentar */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Ulasan Pengunjung</h4>
                        <p className="text-xs text-gray-500 font-medium">{comments.length} Diskusi</p>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">&times;</button>
                    </div>

                    {/* List Komentar */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gray-50/50">
                      {comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">💬</div>
                          <p className="text-sm">Belum ada ulasan. Jadilah yang pertama!</p>
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                  {c.user_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900 text-sm">{c.user_name}</h5>
                                  <div className="flex text-yellow-400 text-[10px]">
                                    {[...Array(5)].map((_, i) => <span key={i}>{i < c.rating ? '★' : '☆'}</span>)}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-800 text-sm leading-snug font-medium">{c.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* FORM INPUT (DIPERBAIKI AGAR LEBIH HITAM/JELAS) */}
                    <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20">
                      <h5 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Tulis Ulasan</h5>

                      {/* Rating Stars */}
                      <div className="flex items-center mb-4 space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setNewComment({ ...newComment, rating: star })} className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${star <= newComment.rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}>★</button>
                        ))}
                        <span className="text-xs text-gray-500 ml-2 font-bold bg-gray-100 px-2 py-0.5 rounded">{newComment.rating > 0 ? `${newComment.rating}.0` : '0.0'}</span>
                      </div>

                      {/* Input Nama */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Nama Anda"
                          className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all font-bold ${
                            isLoggedIn
                              ? 'bg-gray-100 text-gray-500 border-transparent cursor-not-allowed'
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400'
                          }`}
                          value={newComment.name}
                          onChange={(e) => !isLoggedIn && setNewComment({ ...newComment, name: e.target.value })}
                          readOnly={isLoggedIn}
                        />
                      </div>

                      {/* Input Komentar (Teks Lebih Hitam) */}
                      <textarea
                        className="w-full border border-gray-300 rounded-xl p-4 text-sm text-gray-900 font-medium placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all bg-gray-50 focus:bg-white"
                        rows={3}
                        placeholder="Bagikan pendapat Anda tentang karya ini..."
                        value={newComment.text}
                        onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                      ></textarea>

                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting}
                        className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2 ${
                          isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 transform hover:-translate-y-0.5'
                        }`}
                      >
                        {isSubmitting ? 'Mengirim...' : '🚀 Kirim Ulasan'}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}