'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

type FormData = {
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
  prodi: string;
};

const PRODI_OPTIONS = [
  "D3 Teknik Informatika",
  "D4 Teknologi Rekayasa Multimedia",
  "D4 Keamanan Siber",
  "D4 Animasi",
  "D4 Rekayasa Perangkat Lunak",
  "D3 Teknik Elektronika",
  "D4 Mekatronika",
  "D3 Akuntansi"
];

export default function UploadPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', nama_ketua: '', nim_ketua: '', prodi: ''
  });

  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isProdiOpen, setIsProdiOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Cek Auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) { router.push('/login'); return; }
    if (role === 'admin') {
      alert('Admin tidak diperbolehkan mengupload karya.');
      router.push('/dashboard');
      return;
    }
    setIsCheckingAuth(false);

    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsProdiOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  // Handlers
  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    else setSelectedFile(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    if (!formData.title || !formData.nama_ketua || !formData.prodi) {
      setError('Judul, Nama Ketua, dan Prodi wajib diisi.');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('nama_ketua', formData.nama_ketua);
    data.append('nim_ketua', formData.nim_ketua);
    data.append('prodi', formData.prodi);

    if (uploadType === 'file') {
      if (!selectedFile) { setError('Pilih file karya Anda.'); setIsLoading(false); return; }
      data.append('karyaFile', selectedFile);
    } else {
      if (!youtubeLink) { setError('Masukkan link YouTube.'); setIsLoading(false); return; }
      data.append('youtube_link', youtubeLink);
    }

    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal upload');

      setSuccess('Karya berhasil diupload! Mohon tunggu verifikasi admin.');
      setTimeout(() => router.push('/manage'), 2000);
    } catch (err) {
        if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p>Memverifikasi akses...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col font-sans relative text-gray-800">

      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/80 to-blue-900/50 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-20">
        <Navbar />
      </div>

      <div className="relative z-10 flex-grow px-4 py-12 flex justify-center items-center">

        {/* 2. MAIN CARD */}
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">

          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
             <h2 className="text-3xl font-extrabold text-white tracking-tight">Upload Karya Baru</h2>
             <p className="text-blue-100 mt-2 text-sm">Bagikan inovasi terbaikmu kepada dunia.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">

              {/* SECTION: INFORMASI DASAR */}
              <div className="space-y-5">
                 <div className="group">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Judul Karya</label>
                    <input
                        type="text" name="title" value={formData.title} onChange={handleTextChange} required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                        placeholder="Contoh: Sistem Monitoring IoT..."
                    />
                 </div>

                 <div className="group">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Deskripsi Singkat</label>
                    <textarea
                        name="description" value={formData.description} onChange={handleTextChange} rows={4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none placeholder-gray-400"
                        placeholder="Jelaskan keunggulan dan fitur utama karyamu..."
                    />
                 </div>
              </div>

              {/* SECTION: IDENTITAS & PRODI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nama Ketua Tim</label>
                    <input
                        type="text" name="nama_ketua" value={formData.nama_ketua} onChange={handleTextChange} required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Nama Lengkap"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">NIM Ketua</label>
                    <input
                        type="text" name="nim_ketua" value={formData.nim_ketua} onChange={handleTextChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Nomor Induk Mahasiswa"
                    />
                 </div>
              </div>

              {/* Custom Dropdown Prodi */}
              <div className="relative" ref={dropdownRef}>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Program Studi</label>
                 <div
                    onClick={() => setIsProdiOpen(!isProdiOpen)}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium cursor-pointer flex justify-between items-center transition-all ${isProdiOpen ? 'ring-2 ring-blue-500 bg-white' : 'hover:bg-gray-100'}`}
                 >
                    {formData.prodi || <span className="text-gray-400">Pilih Program Studi...</span>}
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isProdiOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                 </div>

                 {isProdiOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-100">
                        {PRODI_OPTIONS.map((prodi, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, prodi: prodi }));
                                    setIsProdiOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border-b last:border-b-0 border-gray-50"
                            >
                                {prodi}
                            </div>
                        ))}
                    </div>
                 )}
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* SECTION: MEDIA UPLOAD */}
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 ml-1">Tipe Media Karya</label>

                 {/* Toggle Buttons */}
                 <div className="flex gap-4 mb-6">
                    <button
                       type="button"
                       onClick={() => setUploadType('file')}
                       className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${uploadType === 'file' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                       <span>📁</span> Upload File
                    </button>
                    <button
                       type="button"
                       onClick={() => setUploadType('youtube')}
                       className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${uploadType === 'youtube' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                       <span>▶️</span> YouTube Link
                    </button>
                 </div>

                 {/* Dynamic Input Area */}
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {uploadType === 'file' ? (
                       <div
                          className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                       >
                          <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" ref={fileInputRef} className="hidden" />
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                             </div>
                             <p className="text-sm font-medium text-gray-700">
                                {selectedFile ? <span className="text-blue-600 font-bold">{selectedFile.name}</span> : "Klik untuk memilih file (Gambar / PDF)"}
                             </p>
                             {!selectedFile && <p className="text-xs text-gray-400">Maksimal 5MB</p>}
                          </div>
                       </div>
                    ) : (
                       <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                          </div>
                          <input
                             type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)}
                             placeholder="https://youtube.com/watch?v=..."
                             className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-gray-400"
                          />
                       </div>
                    )}
                 </div>
              </div>

              {/* BUTTON SUBMIT */}
              <button
                 type="submit" disabled={isLoading}
                 className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                 {isLoading ? (
                    <>
                       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       <span>Mengunggah...</span>
                    </>
                 ) : (
                    '🚀 Submit Karya Sekarang'
                 )}
              </button>

              {/* Notifications */}
              {error && (
                 <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span className="font-medium text-sm">{error}</span>
                 </div>
              )}
              {success && (
                 <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="font-medium text-sm">{success}</span>
                 </div>
              )}

          </form>
        </div>
      </div>
    </div>
  );
}