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
  prodi: string; // [BARU] Field Prodi
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
  const [isProdiOpen, setIsProdiOpen] = useState(false); // State untuk dropdown

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

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

    // Tutup dropdown jika klik di luar
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsProdiOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

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

    // Validasi input
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
    data.append('prodi', formData.prodi); // [BARU] Kirim prodi

    if (uploadType === 'file') {
      if (!selectedFile) { setError('Pilih file dulu.'); setIsLoading(false); return; }
      data.append('karyaFile', selectedFile);
    } else {
      if (!youtubeLink) { setError('Isi link YouTube.'); setIsLoading(false); return; }
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

      setSuccess('Berhasil upload! Mengalihkan...');
      setTimeout(() => router.push('/manage'), 1500);
    } catch (err) {
        if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#424b24] text-white">Memverifikasi akses...</div>;

  return (
    <div className="flex min-h-screen flex-col font-sans relative">
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" priority />
      </div>
      <div className="relative z-20"><Navbar /></div>

      <div className="relative z-10 flex-grow px-4 py-10 flex justify-center items-center">
        <div className="w-full max-w-2xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-white drop-shadow-md">Ungga Karya Baru</h2>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-2xl space-y-6 relative">

             {/* Input Judul */}
             <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">Judul Karya baru</label>
              <input type="text" name="title" value={formData.title} onChange={handleTextChange} required className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Judul..."/>
             </div>

             {/* Input Deskripsi */}
             <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">Deskripsi Karya</label>
              <textarea name="description" value={formData.description} onChange={handleTextChange} rows={4} className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deskripsi..."/>
             </div>

             {/* Identitas */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">Nama ketua</label>
                  <input type="text" name="nama_ketua" value={formData.nama_ketua} onChange={handleTextChange} required className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama..."/>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-700">NIM Ketua</label>
                  <input type="text" name="nim_ketua" value={formData.nim_ketua} onChange={handleTextChange} className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="NIM..."/>
                </div>
             </div>

             {/* [BARU] DROPDOWN PRODI */}
             <div className="relative" ref={dropdownRef}>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Program Studi</label>
                <div
                    onClick={() => setIsProdiOpen(!isProdiOpen)}
                    className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900 bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-blue-500"
                >
                    {formData.prodi || <span className="text-gray-400 font-normal">Pilih Program Studi...</span>}
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${isProdiOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* List Dropdown */}
                {isProdiOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {PRODI_OPTIONS.map((prodi, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, prodi: prodi }));
                                    setIsProdiOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border-b last:border-b-0 border-gray-100"
                            >
                                {prodi}
                            </div>
                        ))}
                    </div>
                )}
             </div>

             <hr className="border-gray-200" />

             {/* Jenis Karya */}
             <fieldset>
              <legend className="mb-3 block text-sm font-bold text-gray-700">Jenis Karya</legend>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <input id="type_file" name="uploadType" type="radio" value="file" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="type_file" className="ml-2 block text-sm font-medium text-gray-900">Upload File</label>
                </div>
                <div className="flex items-center">
                  <input id="type_youtube" name="uploadType" type="radio" value="youtube" checked={uploadType === 'youtube'} onChange={() => setUploadType('youtube')} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="type_youtube" className="ml-2 block text-sm font-medium text-gray-900">Link YouTube</label>
                </div>
              </div>
             </fieldset>

             {uploadType === 'file' ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <label className="mb-2 block text-sm font-bold text-gray-700">Pilih File</label>
                <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" ref={fileInputRef} className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:py-2.5 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 cursor-pointer" />
              </div>
             ) : (
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Link YouTube</label>
                <input type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} placeholder="https://..." className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900"/>
              </div>
             )}

             <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg">
                {isLoading ? 'Mengunggah...' : 'Submit Karya'}
             </button>

             {error && <p className="text-red-600 text-center font-bold bg-red-50 p-2 rounded">{error}</p>}
             {success && <p className="text-green-600 text-center font-bold bg-green-50 p-2 rounded">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}