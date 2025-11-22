'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Image untuk background
import Navbar from '../../components/Navbar';

// Tipe untuk data form
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
    title: '',
    description: '',
    nama_ketua: '',
    nim_ketua: '',
  });

  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Proteksi Halaman
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesi Anda telah berakhir. Silakan login kembali.');
      setIsLoading(false);
      router.push('/login');
      return;
    }

    if (!formData.title || !formData.nama_ketua) {
      setError('Judul karya dan Nama Ketua wajib diisi.');
      setIsLoading(false);
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('nama_ketua', formData.nama_ketua);
    data.append('nim_ketua', formData.nim_ketua);

    if (uploadType === 'file') {
      if (!selectedFile) {
        setError('Silakan pilih file untuk diunggah.');
        setIsLoading(false);
        return;
      }
      data.append('karyaFile', selectedFile);

    } else if (uploadType === 'youtube') {
      if (!youtubeLink) {
        setError('Silakan masukkan link YouTube.');
        setIsLoading(false);
        return;
      }
      if (!youtubeLink.startsWith('http')) {
        setError('Link YouTube harus diawali dengan http:// atau https://');
        setIsLoading(false);
        return;
      }
      data.append('youtube_link', youtubeLink);
    }

    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error((result as ErrorResponse).message || 'Terjadi kesalahan saat mengunggah karya.');
      }

      setSuccess('Karya berhasil diunggah!');
      setFormData({ title: '', description: '', nama_ketua: '', nim_ketua: '' });
      setSelectedFile(null);
      setYoutubeLink('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          setError('Terjadi masalah dengan server. Pastikan backend Anda berjalan.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Terjadi kesalahan yang tidak diketahui.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#424b24]">
        <p className="text-lg text-white">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans relative">
      {/* 1. Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        {/* Overlay hitam transparan agar form lebih menonjol */}
        {/* <div className="absolute inset-0 bg-black/20"></div> */}
      </div>

      {/* Navbar Global */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Konten Utama */}
      <div className="relative z-10 flex-grow px-4 py-10 flex justify-center items-center">
        <div className="w-full max-w-2xl">

          {/* Judul Halaman (Putih agar kontras dengan background hijau) */}
          <h2 className="mb-6 text-center text-3xl font-bold text-white drop-shadow-md">
            Unggah Karya Baru Anda
          </h2>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-2xl space-y-6">

            {/* Input: Judul Karya */}
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-bold text-gray-700">
                Judul Karya
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleTextChange}
                required
                placeholder="Contoh: Aplikasi E-Voting Berbasis Blockchain"
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                           text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
              />
            </div>

            {/* Input: Deskripsi */}
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-bold text-gray-700">
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                rows={4}
                placeholder="Jelaskan fitur utama, teknologi yang digunakan, dan tujuan dari karya ini..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                           text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
              />
            </div>

            {/* Grid untuk Nama & NIM Ketua agar sejajar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nama_ketua" className="mb-1.5 block text-sm font-bold text-gray-700">
                  Nama Ketua
                </label>
                <input
                  type="text"
                  id="nama_ketua"
                  name="nama_ketua"
                  value={formData.nama_ketua}
                  onChange={handleTextChange}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                             text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="nim_ketua" className="mb-1.5 block text-sm font-bold text-gray-700">
                  NIM Ketua
                </label>
                <input
                  type="text"
                  id="nim_ketua"
                  name="nim_ketua"
                  value={formData.nim_ketua}
                  onChange={handleTextChange}
                  placeholder="Contoh: 33120010"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                             text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Pilihan Jenis Karya */}
            <fieldset>
              <legend className="mb-3 block text-sm font-bold text-gray-700">Jenis Karya</legend>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <input
                    id="type_file"
                    name="uploadType"
                    type="radio"
                    value="file"
                    checked={uploadType === 'file'}
                    onChange={() => setUploadType('file')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="type_file" className="ml-2 block text-sm font-medium text-gray-900">
                    Upload File (Gambar/PDF)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="type_youtube"
                    name="uploadType"
                    type="radio"
                    value="youtube"
                    checked={uploadType === 'youtube'}
                    onChange={() => setUploadType('youtube')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="type_youtube" className="ml-2 block text-sm font-medium text-gray-900">
                    Link YouTube
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Input Kondisional */}
            {uploadType === 'file' ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <label htmlFor="karyaFile" className="mb-2 block text-sm font-bold text-gray-700">
                  Pilih File
                </label>
                <input
                  type="file"
                  id="karyaFile"
                  name="karyaFile"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                  ref={fileInputRef}
                  className="w-full text-sm text-gray-500
                             file:mr-4 file:rounded-md file:border-0
                             file:bg-blue-600 file:py-2.5 file:px-4
                             file:text-sm file:font-semibold file:text-white
                             hover:file:bg-blue-700 cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format: JPG, PNG, atau PDF. Maksimal ukuran: 10MB.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="youtube_link" className="mb-1.5 block text-sm font-bold text-gray-700">
                  Link YouTube
                </label>
                <input
                  type="url"
                  id="youtube_link"
                  name="youtube_link"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                             text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Tombol Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-md
                           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Sedang Mengunggah...' : 'Submit Karya'}
              </button>
            </div>

            {/* Pesan Status */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-center text-sm font-medium text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-center text-sm font-medium text-green-600">{success}</p>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}