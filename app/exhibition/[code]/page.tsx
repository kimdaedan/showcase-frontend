"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../../../components/Navbar";
import Scene3D from "../../../components/Scene3D";
import { Suspense, useEffect, useState, useCallback } from "react";

// --- TIPE DATA ---
type Project = {
  id: number;
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  karya_type: "IMAGE" | "PDF" | "YOUTUBE";
  karya_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  prodi?: string;
};

type Comment = {
  id: number;
  user_name: string;
  comment: string;
  rating: number;
  created_at: string;
};

// ==================================================================================
// 🛠️ KONFIGURASI 8 PRODI (ISI NAMA MESH DI SINI)
// ==================================================================================
const PRODI_CONFIG: {
  [key: string]: {
    name: string;
    model: string;
    theme: string;
    has3D: boolean;
    slots: string[]; // Masukkan nama mesh dari Blender di sini
  };
} = {
  // 1. D4 Teknologi Rekayasa Multimedia (TRM)
  trm: {
    name: "D4 Teknologi Rekayasa Multimedia",
    model: "/models/informatika.glb",
    theme: "from-blue-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH INFORMATIKA DI BAWAH INI
      "Game_VideoSlot1",
      "Magister_VideoSlot1",
      "RKS_VideoSlot1",
      "AN_VideoSlot1",
    ],
  },

  // 2. D4 Rekayasa Perangkat Lunak (RPL)
  rpl: {
    name: "D4 Rekayasa Perangkat Lunak",
    model: "/models/RPL.glb",
    theme: "from-cyan-900/90",
    has3D: true,
    slots: [
      "AN_VID_Slot5",
      "AN_VID_Slot6",
      "AN_VID_Slot7",
      "AN_VID_Slot8",
      "AN_VID_Slot9",
    ],
  },

  // 3. D4 Animasi
  animasi: {
    name: "D4 Animasi",
    model: "/models/informatika.glb",
    theme: "from-blue-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH INFORMATIKA DI BAWAH INI
      "Game_VideoSlot1",
      "Magister_VideoSlot1",
      "RKS_VideoSlot1",
      "AN_VideoSlot1",
    ],
  },

  // 4. D3 Teknik Informatika (IF)
  if: {
    name: "D3 Teknik Informatika",
    model: "/models/informatika.glb",
    theme: "from-blue-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH INFORMATIKA DI BAWAH INI
      "Game_VideoSlot1",
      "Magister_VideoSlot1",
      "RKS_VideoSlot1",
      "AN_VideoSlot1",
    ],
  },

  // 5. D4 Keamanan Siber (Cyber)
  cyber: {
    name: "D4 Keamanan Siber",
     model: "/models/informatika.glb",
    theme: "from-blue-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH INFORMATIKA DI BAWAH INI
      "Game_VideoSlot1",
      "Magister_VideoSlot1",
      "RKS_VideoSlot1",
      "AN_VideoSlot1",
    ],
  },

  // 6. D3 Teknik Geomatika (Contoh)
  geomatika: {
    name: "D4 Teknik Geomatika",
    model: "/models/RPL.glb",
    theme: "from-emerald-900/90",
    has3D: true,
    slots: [
      "AN_VID_Slot5",
      "AN_VID_Slot6",
      "AN_VID_Slot7",
      "AN_VID_Slot8",
      "AN_VID_Slot9",
    ],
  },

  // 7. D3 Teknik Permainan (Contoh)
  game: {
    name: "D3 Teknik Permainan",
    model: "/models/permainan.glb",
    theme: "from-yellow-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH ELEKTRO
      "AN_VID_Slot5",
      "AN_VID_Slot6",
      "AN_VID_Slot7",
      "AN_VID_Slot8",
      "AN_VID_Slot9",
    ],
  },

 magister: {
    name: "Magister Teknik Komputer",
    model: "/models/permainan.glb",
    theme: "from-yellow-900/90",
    has3D: true,
    slots: [
      // MASUKKAN NAMA MESH ELEKTRO
      "AN_VID_Slot5",
      "AN_VID_Slot6",
      "AN_VID_Slot7",
      "AN_VID_Slot8",
      "AN_VID_Slot9",
    ],
  },

  // DEFAULT (Jika kode tidak ditemukan)
  default: {
    name: "Program Studi",
    model: "",
    theme: "from-gray-900/90",
    has3D: false,
    slots: [],
  },
};
// ==================================================================================

// --- HELPER THUMBNAIL YOUTUBE ---
const getYouTubeThumbnail = (url: string) => {
  let videoId = "";
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  if (match && match[1]) {
    videoId = match[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return "https://via.placeholder.com/640x360.png?text=Video+Tidak+Tersedia";
};

export default function ProdiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode =
    typeof params.code === "string" ? params.code.toLowerCase() : "";
  const config = PRODI_CONFIG[rawCode] || {
    ...PRODI_CONFIG.default,
    name: `Prodi ${rawCode.toUpperCase()}`,
  };

  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [displayProject, setDisplayProject] = useState<Project | null>(null);

  const [hoverInfo, setHoverInfo] = useState<{
    show: boolean;
    x: number;
    y: number;
  }>({ show: false, x: 0, y: 0 });
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({
    name: "",
    text: "",
    rating: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- CEK LOGIN ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("userName");
    if (token && storedName) {
      setIsLoggedIn(true);
      setNewComment((prev) => ({ ...prev, name: storedName }));
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // --- FETCH PROJECTS ---
  useEffect(() => {
    const fetchApprovedProject = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/projects");
        const data = await res.json();

        const approvedList = data.filter(
          (p: Project) =>
            p.status === "APPROVED" &&
            (p.karya_type === "IMAGE" || p.karya_type === "YOUTUBE") &&
            p.prodi === config.name
        );

        if (approvedList.length > 0) {
          // Ambil jumlah maksimal karya sesuai jumlah slot mesh yang tersedia
          const maxSlots = config.slots.length > 0 ? config.slots.length : 20;
          const limitedList = approvedList.slice(0, maxSlots);

          setProjectsList(limitedList);

          const urls = limitedList.map((p: Project) => {
            if (p.karya_type === "YOUTUBE") {
              return getYouTubeThumbnail(p.karya_url);
            } else {
              return `http://localhost:5000/${p.karya_url}`;
            }
          });

          setProjectImages(urls);
          setDisplayProject(limitedList[0]);
        } else {
          setProjectsList([]);
          setProjectImages([]);
          setDisplayProject(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchApprovedProject();
  }, [config.name, config.slots.length]);

  // --- FETCH COMMENTS ---
  const fetchComments = async (projectId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/comments/${projectId}`
      );
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- SUBMIT COMMENT ---
  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      alert("Silakan login terlebih dahulu untuk memberikan ulasan.");
      router.push("/login");
      return;
    }
    if (!displayProject) return;
    if (!newComment.text || newComment.rating === 0) {
      alert("Mohon isi komentar dan rating!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: displayProject.id,
          user_name: newComment.name,
          comment: newComment.text,
          rating: newComment.rating,
        }),
      });

      if (res.ok) {
        setNewComment((prev) => ({ ...prev, text: "", rating: 0 }));
        fetchComments(displayProject.id);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHoverScreen = useCallback(
    (isHovering: boolean, x: number, y: number) => {
      setHoverInfo((prev) => {
        if (prev.show === isHovering && prev.x === x && prev.y === y)
          return prev;
        return isHovering ? { show: true, x, y } : { show: false, x: 0, y: 0 };
      });
    },
    []
  );

  const handleClickScreen = useCallback(
    (index: number) => {
      if (projectsList && projectsList[index]) {
        setDisplayProject(projectsList[index]);
        fetchComments(projectsList[index].id);
        setShowPreviewPopup(true);
      }
    },
    [projectsList]
  );

  return (
    <main className="flex min-h-screen flex-col font-sans relative overflow-hidden text-gray-800">
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b ${config.theme} via-black/70 to-gray-900/95`}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <Link
          href="/exhibition"
          className="fixed top-24 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>{" "}
          Kembali
        </Link>

        <div className="flex-grow px-4 py-8 flex justify-center items-center">
          <div className="w-full max-w-7xl bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-[85vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-md">
                  {config.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-gray-200 text-xs font-bold rounded uppercase">
                    KODE: {rawCode}
                  </span>
                  <span className="text-gray-400 text-xs">
                    • Virtual Exhibition Hall
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-grow p-4 relative bg-gray-900/50">
              {config.has3D ? (
                <div className="flex flex-col h-full rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
                    <span className="text-xs text-gray-300 font-medium">
                      🎮 Navigasi: <b>WASD</b> (Gerak) • <b>Klik Layar</b>{" "}
                      (Lihat Karya)
                    </span>
                  </div>
                  <div className="flex-grow w-full h-full bg-gradient-to-b from-gray-800 to-black">
                    <Suspense
                      fallback={
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold animate-pulse">
                          Memuat Pameran 3D...
                        </div>
                      }
                    >
                      {/* --- COMPONENT SCENE 3D --- */}
                      <Scene3D
                        modelUrl={config.model}
                        images={projectImages}
                        slotNames={config.slots} // MENGIRIM DATA NAMA MESH KE 3D
                        onHoverScreen={handleHoverScreen}
                        onClickScreen={handleClickScreen}
                      />
                      {/* ------------------------- */}
                    </Suspense>
                  </div>

                  {hoverInfo.show && (
                    <div
                      className="fixed pointer-events-none z-50 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-full mt-[-15px]"
                      style={{ left: hoverInfo.x, top: hoverInfo.y }}
                    >
                      👆 Klik Detail
                    </div>
                  )}
                  {showPreviewPopup && displayProject && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {displayProject.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                          {displayProject.description}
                        </p>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => {
                              setShowPreviewPopup(false);
                              setShowDetailModal(true);
                            }}
                            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold"
                          >
                            Buka Detail Lengkap
                          </button>
                          <button
                            onClick={() => setShowPreviewPopup(false)}
                            className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl font-bold"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl">
                    🚧
                  </div>
                  <h3 className="text-xl font-bold text-white">Segera Hadir</h3>
                  <p className="text-gray-400 font-light max-w-md">
                    Pameran virtual untuk <b>{config.name}</b> sedang
                    dikembangkan.
                  </p>
                  <Link
                    href="/exhibition"
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition-colors"
                  >
                    Cari Prodi Lain
                  </Link>
                </div>
              )}
            </div>

            {/* --- MODAL DETAIL --- */}
            {showDetailModal && displayProject && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
                {showSuccessToast && (
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[110] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
                    <span className="text-xl">✅</span>
                    <span className="font-bold">Ulasan Terkirim!</span>
                  </div>
                )}
                <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                  {/* KIRI */}
                  <div className="md:w-3/5 p-8 overflow-y-auto bg-gray-50 custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                          {displayProject.title}
                        </h2>
                        <div className="mt-2 text-sm text-gray-600 font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded inline-block">
                          Ketua: {displayProject.nama_ketua} (
                          {displayProject.nim_ketua})
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="md:hidden text-gray-400 text-3xl"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="aspect-video relative rounded-xl overflow-hidden shadow-lg mb-4 bg-black">
                      {displayProject.karya_type === "YOUTUBE" ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={
                            displayProject.karya_url
                              .replace("watch?v=", "embed/")
                              .split("&")[0]
                          }
                          title="YouTube"
                          frameBorder="0"
                          allowFullScreen
                          className="absolute inset-0"
                        />
                      ) : (
                        <Image
                          src={`http://localhost:5000/${displayProject.karya_url}`}
                          alt="Karya"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>

                    {displayProject.karya_type === "YOUTUBE" && (
                      <a
                        href={displayProject.karya_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-6 flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>{" "}
                        Tonton di YouTube
                      </a>
                    )}

                    <div className="prose max-w-none">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">
                        Tentang Karya
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-justify whitespace-pre-line font-medium">
                        {displayProject.description}
                      </p>
                    </div>
                  </div>

                  {/* KANAN */}
                  <div className="md:w-2/5 bg-white border-l border-gray-200 flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <h4 className="font-bold text-gray-900 text-lg">
                        Ulasan ({comments.length})
                      </h4>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="hidden md:flex text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-400 mt-10">
                          Belum ada ulasan.
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-gray-900 text-sm">
                                {c.user_name}
                              </span>
                              <span className="text-yellow-500 text-xs">
                                {"★".repeat(c.rating)}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm">{c.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-6 bg-white border-t border-gray-200 shadow-lg z-20">
                      <h5 className="text-sm font-bold text-gray-800 mb-3">
                        Tulis Ulasan
                      </h5>
                      {isLoggedIn ? (
                        <>
                          <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  setNewComment({ ...newComment, rating: s })
                                }
                                className={`text-2xl ${
                                  s <= newComment.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg mb-3 text-gray-900 font-bold bg-gray-100 cursor-not-allowed"
                            value={newComment.name}
                            readOnly
                          />
                          <textarea
                            className="w-full border rounded-lg p-3 text-gray-900 font-bold placeholder-gray-500 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={2}
                            placeholder="Ketik ulasan di sini..."
                            value={newComment.text}
                            onChange={(e) =>
                              setNewComment({
                                ...newComment,
                                text: e.target.value,
                              })
                            }
                          ></textarea>
                          <button
                            onClick={handleSubmitComment}
                            disabled={isSubmitting}
                            className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                          >
                            {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
                          </button>
                        </>
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-gray-500 text-sm mb-3">
                            Anda harus login untuk memberikan ulasan.
                          </p>
                          <button
                            onClick={() => router.push("/login")}
                            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                          >
                            Login Masuk
                          </button>
                        </div>
                      )}
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
