'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

// ... (Tipe Data FormData dan ErrorResponse sama seperti sebelumnya) ...
type FormData = {
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
};

type ErrorResponse = {
  message: string;
};

export default function UploadPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', nama_ketua: '', nim_ketua: '',
  });
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // 1. Proteksi Halaman (Token & Role)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) {
      router.push('/login');
      return;
    }

    // [LOGIKA BARU] Jika Admin mencoba masuk, tendang keluar
    if (role === 'admin') {
      alert('Admin tidak diperbolehkan mengupload karya.');
      router.push('/dashboard'); // Kembalikan ke dashboard admin
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  // ... (Sisa kode handleTextChange, handleFileChange, handleSubmit SAMA PERSIS seperti sebelumnya) ...
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
    setIsLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    if (!formData.title || !formData.nama_ketua) {
      setError('Judul dan Nama Ketua wajib diisi.');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('nama_ketua', formData.nama_ketua);
    data.append('nim_ketua', formData.nim_ketua);

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
      setTimeout(() => router.push('/manage'), 1500); // Redirect ke Manage Karya User
    } catch (err) {
        if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-[#424b24] text-white">Memverifikasi akses...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans relative">
      <div className="absolute inset-0 z-0">
        <Image src="/future.jpg" alt="Background" fill className="object-cover" priority />
      </div>
      <div className="relative z-20"><Navbar /></div>

      <div className="relative z-10 flex-grow px-4 py-10 flex justify-center items-center">
        <div className="w-full max-w-2xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-white drop-shadow-md">Unggah Karya Baru</h2>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-2xl space-y-6">
             {/* ... (Bagian Input Form SAMA seperti sebelumnya) ... */}
             <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-gray-700">Judul Karya</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleTextChange} required className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900" placeholder="Judul..."/>
             </div>
             <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-bold text-gray-700">Deskripsi</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleTextChange} rows={4} className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900" placeholder="Deskripsi..."/>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nama_ketua" className="mb-1.5 block text-sm font-bold text-gray-700">Nama Ketua</label>
                  <input type="text" id="nama_ketua" name="nama_ketua" value={formData.nama_ketua} onChange={handleTextChange} required className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900" placeholder="Nama..."/>
                </div>
                <div>
                  <label htmlFor="nim_ketua" className="mb-1.5 block text-sm font-bold text-gray-700">NIM Ketua</label>
                  <input type="text" id="nim_ketua" name="nim_ketua" value={formData.nim_ketua} onChange={handleTextChange} className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900" placeholder="NIM..."/>
                </div>
             </div>
             <hr className="border-gray-200" />
             <fieldset>
              <legend className="mb-3 block text-sm font-bold text-gray-700">Jenis Karya</legend>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <input id="type_file" name="uploadType" type="radio" value="file" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="type_file" className="ml-2 block text-sm font-medium text-gray-900">Upload File</label>
                </div>
                <div className="flex items-center">
                  <input id="type_youtube" name="uploadType" type="radio" value="youtube" checked={uploadType === 'youtube'} onChange={() => setUploadType('youtube')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="type_youtube" className="ml-2 block text-sm font-medium text-gray-900">Link YouTube</label>
                </div>
              </div>
             </fieldset>
             {uploadType === 'file' ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <label htmlFor="karyaFile" className="mb-2 block text-sm font-bold text-gray-700">Pilih File</label>
                <input type="file" id="karyaFile" name="karyaFile" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" ref={fileInputRef} className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:py-2.5 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 cursor-pointer" />
              </div>
             ) : (
              <div>
                <label htmlFor="youtube_link" className="mb-1.5 block text-sm font-bold text-gray-700">Link YouTube</label>
                <input type="url" id="youtube_link" name="youtube_link" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} placeholder="https://..." className="w-full border-gray-300 border p-2 rounded font-semibold text-gray-900"/>
              </div>
             )}

             {/* Tombol Submit */}
             <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Mengunggah...' : 'Submit Karya'}
             </button>

             {error && <p className="text-red-600 text-center font-bold">{error}</p>}
             {success && <p className="text-green-600 text-center font-bold">{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}