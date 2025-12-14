'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Scene3D from '../../../components/Scene3D';
import { Suspense, useEffect, useState, useCallback } from 'react';

// Tipe Data Project
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

// Tipe Data Comment
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

  // [BARU] State untuk mengecek apakah user login
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mapping Nama Prodi
  const prodiNameMap: { [key: string]: string } = {
    if: "D3 Teknik Informatika", trm: "D4 Teknologi Rekayasa Multimedia", cyber: "D4 Keamanan Siber",
    animasi: "D4 Animasi", rpl: "D4 Rekayasa Perangkat Lunak", elka: "D3 Teknik Elektronika",
    mk: "D4 Mekatronika", ak: "D3 Akuntansi"
  };
  const title = prodiNameMap[code] || "Detail Program Studi";
  const targetProdi = prodiNameMap[code];

  // --- 1. CEK LOGIN & AMBIL NAMA OTOMATIS ---
  useEffect(() => {
    // Ambil userName dari localStorage (sesuai yang diset di halaman Login)
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

    // Validasi
    if (!newComment.name) {
       alert("Mohon isi nama Anda (atau Login terlebih dahulu).");
       return;
    }
    if (!newComment.text || newComment.rating === 0) {
      alert("Mohon isi Komentar dan beri Rating bintang!");
      return;
    }

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
        // Reset hanya text & rating, Nama biarkan tetap ada jika login
        setNewComment(prev => ({
            ...prev,
            text: '',
            rating: 0,
            // Jika tidak login, reset nama juga. Jika login, pertahankan nama.
            name: isLoggedIn ? prev.name : ''
        }));

        fetchComments(displayProject.id);

        // Tampilkan Notifikasi Sukses
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim komentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLERS INTERAKSI SCENE 3D ---
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
    <main className="flex min-h-screen flex-col font-sans relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" quality={100} priority />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-grow px-4 py-8 flex justify-center">
          <div className="w-full max-w-7xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden flex flex-col border border-white/20 relative">

            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">KODE: {code}</p>
              </div>
              <Link href="/exhibition" className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center font-bold">
                &larr; Kembali ke Daftar
              </Link>
            </div>

            {/* Content Area */}
            <div className="flex-grow p-6 relative">
              {isInformatika ? (
                <div className="flex flex-col h-[75vh]">
                   <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Pameran Virtual 3D</h2>
                    <p className="text-gray-600 text-sm">Gunakan <b>WASD</b> untuk berjalan dan <b>Klik Layar</b> untuk detail.</p>
                  </div>
                  <div className="flex-grow w-full rounded-xl border-4 border-gray-300 bg-gray-900 relative shadow-inner overflow-hidden">
                    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white">Loading...</div>}>
                      <Scene3D modelUrl="/models/booth_a.glb" images={projectImages} onHoverScreen={handleHoverScreen} onClickScreen={handleClickScreen} />
                    </Suspense>
                    {/* Tooltip & Preview Popup */}
                    {hoverInfo.show && (
                      <div className="fixed pointer-events-none z-50 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20 transform -translate-x-1/2 -translate-y-full mt-[-10px]" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
                        Klik untuk Detail
                      </div>
                    )}
                    {showPreviewPopup && displayProject && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center transform transition-all scale-100">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{displayProject.title}</h3>
                          <p className="text-gray-500 text-sm mb-6 line-clamp-2">{displayProject.description}</p>
                          <div className="flex flex-col gap-3">
                            <button onClick={() => { setShowPreviewPopup(false); setShowDetailModal(true); }} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Lihat Detail Lengkap</button>
                            <button onClick={() => setShowPreviewPopup(false)} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">Tutup</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6"><p className="text-gray-500">Konten belum tersedia.</p></div>
              )}
            </div>

            {/* --- MODAL DETAIL FULL SCREEN --- */}
            {showDetailModal && displayProject && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">

                {/* Toast Notifikasi Sukses */}
                {showSuccessToast && (
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-[110] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
                    <span className="text-xl">✅</span>
                    <span className="font-bold">Ulasan berhasil dikirim!</span>
                  </div>
                )}

                <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">

                  {/* Kolom Kiri: Detail Karya */}
                  <div className="md:w-3/5 p-8 overflow-y-auto bg-white custom-scrollbar">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">{displayProject.title}</h2>
                        <p className="text-gray-500 font-medium mt-1">{displayProject.nama_ketua} • {displayProject.nim_ketua}</p>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="md:hidden text-gray-400 text-3xl">&times;</button>
                    </div>
                    <div className="aspect-video relative rounded-xl overflow-hidden border border-gray-200 shadow-md mb-6 bg-gray-100">
                      <Image src={`http://localhost:5000/${displayProject.karya_url}`} alt="Karya" fill className="object-cover" unoptimized />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg border-b pb-2 mb-3">Tentang Karya</h4>
                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line text-justify">{displayProject.description}</p>
                  </div>

                  {/* Kolom Kanan: Komentar */}
                  <div className="md:w-2/5 bg-gray-50 border-l border-gray-200 flex flex-col h-full">

                    {/* Header Komentar */}
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Ulasan Pengunjung</h4>
                        <p className="text-xs text-gray-500">{comments.length} Komentar</p>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="hidden md:block text-gray-400 hover:text-red-500 text-4xl font-light transition leading-none">&times;</button>
                    </div>

                    {/* List Komentar */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-4">
                      {comments.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                          <span className="text-4xl mb-2">💬</span>
                          <p className="text-sm">Belum ada ulasan.<br/>Jadilah yang pertama berkomentar!</p>
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase border border-blue-200">
                                  {c.user_name.substring(0, 2)}
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{c.user_name}</h5>
                                  <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex text-yellow-400 text-xs">
                                {[...Array(5)].map((_, i) => <span key={i}>{i < c.rating ? '★' : '☆'}</span>)}
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm leading-snug break-words">{c.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* FORM INPUT ULASAN */}
                    <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                      <h5 className="text-sm font-bold text-gray-700 mb-3">Beri Ulasan Anda</h5>

                      {/* Rating Input */}
                      <div className="flex items-center mb-3 space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setNewComment({ ...newComment, rating: star })} className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${star <= newComment.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                        ))}
                        <span className="text-xs text-gray-500 ml-2 font-medium">{newComment.rating > 0 ? `${newComment.rating}.0` : 'Pilih Bintang'}</span>
                      </div>

                      {/* INPUT NAMA OTOMATIS */}
                      <input
                        type="text"
                        placeholder="Nama Anda"
                        // Jika sudah login (isLoggedIn=true), input jadi abu-abu (readOnly)
                        className={`w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-all ${
                          isLoggedIn ? 'bg-gray-100 text-gray-500 cursor-not-allowed font-semibold' : 'bg-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        value={newComment.name}
                        // Hanya bisa diketik manual jika BELUM login
                        onChange={(e) => !isLoggedIn && setNewComment({ ...newComment, name: e.target.value })}
                        readOnly={isLoggedIn}
                      />

                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                        rows={2}
                        placeholder="Tulis pendapat Anda..."
                        value={newComment.text}
                        onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                      ></textarea>

                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting}
                        className={`mt-3 w-full py-2.5 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95 ${
                          isSubmitting
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                        }`}
                      >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
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