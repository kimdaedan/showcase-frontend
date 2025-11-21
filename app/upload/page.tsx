'use client';

import { useState, useEffect, useRef } from 'react'; // Impor useRef
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

// Tipe untuk data form
type FormData = {
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
};

// Tipe untuk respons error dari backend
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

  // Buat ref untuk input file agar bisa di-reset secara programatik
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

    // Validasi input form dasar
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
      // Tambahkan validasi sederhana untuk link YouTube
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

      const result = await response.json(); // Pastikan selalu mencoba membaca JSON

      if (!response.ok) {
        // Asumsikan backend selalu mengirim JSON error
        throw new Error((result as ErrorResponse).message || 'Terjadi kesalahan saat mengunggah karya.');
      }

      setSuccess('Karya berhasil diunggah!');
      // Reset form dan input file
      setFormData({ title: '', description: '', nama_ketua: '', nim_ketua: '' });
      setSelectedFile(null);
      setYoutubeLink('');
      if (fileInputRef.current) { // Reset input file visual
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Fetch error:', err); // Log error asli untuk debugging
      if (err instanceof Error) {
        // Cek jika error dari JSON parse (ini yang menyebabkan "Unexpected token '<'")
        if (err.message.includes('JSON')) {
          setError('Terjadi masalah dengan server (bukan JSON yang diharapkan). Pastikan backend Anda berjalan dan rutenya benar.');
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Memverifikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-2xl p-6">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Unggah Karya Baru Anda
        </h2>

        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-8 shadow-md space-y-5">
          {/* Data Teks (Tidak ada perubahan signifikan) */}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Judul Karya</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleTextChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="nama_ketua" className="mb-1 block text-sm font-medium text-gray-700">Nama Ketua</label>
            <input
              type="text"
              id="nama_ketua"
              name="nama_ketua"
              value={formData.nama_ketua}
              onChange={handleTextChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="nim_ketua" className="mb-1 block text-sm font-medium text-gray-700">NIM Ketua</label>
            <input
              type="text"
              id="nim_ketua"
              name="nim_ketua"
              value={formData.nim_ketua}
              onChange={handleTextChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <hr />

          {/* Pilihan Jenis Karya */}
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">Jenis Karya</legend>
            <div className="flex gap-4">
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
                <label htmlFor="type_file" className="ml-2 block text-sm text-gray-900">Upload File (Gambar/PDF)</label>
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
                <label htmlFor="type_youtube" className="ml-2 block text-sm text-gray-900">Link YouTube</label>
              </div>
            </div>
          </fieldset>

          {/* Input Kondisional */}
          {uploadType === 'file' ? (
            <div>
              <label htmlFor="karyaFile" className="mb-1 block text-sm font-medium text-gray-700">Upload File</label>
              <input
                type="file"
                id="karyaFile"
                name="karyaFile"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                ref={fileInputRef} // Tambahkan ref di sini
                className="w-full text-sm text-gray-500
                           file:mr-4 file:rounded-md file:border-0
                           file:bg-blue-50 file:py-2 file:px-4
                           file:text-sm file:font-semibold file:text-blue-700
                           hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">Maks 10MB. Tipe file: JPG, PNG, atau PDF.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="youtube_link" className="mb-1 block text-sm font-medium text-gray-700">Link YouTube</label>
              <input
                type="url"
                id="youtube_link"
                name="youtube_link"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tombol Submit */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Mengunggah...' : 'Submit Karya'}
            </button>
          </div>

          {/* Tampilkan Pesan Error atau Sukses */}
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-center text-sm text-green-600">{success}</p>
          )}

        </form>
      </div>
    </div>
  );
}