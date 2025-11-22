'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../../components/Navbar';

type FormData = {
  title: string;
  description: string;
  nama_ketua: string;
  nim_ketua: string;
};

export default function EditProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    title: '', description: '', nama_ketua: '', nim_ketua: '',
  });
  const [uploadType, setUploadType] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Load Data Lama
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const fetchProject = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/projects/${id}`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();

        if (data.status !== 'PENDING') {
          alert('Karya ini sudah diverifikasi dan tidak bisa diedit.');
          router.push('/manage');
          return;
        }

        setFormData({
          title: data.title,
          description: data.description,
          nama_ketua: data.nama_ketua,
          nim_ketua: data.nim_ketua
        });

        if (data.karya_type === 'YOUTUBE') {
          setUploadType('youtube');
          setYoutubeLink(data.karya_url);
        } else {
          setUploadType('file');
        }
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data proyek');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('token');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('nama_ketua', formData.nama_ketua);
    data.append('nim_ketua', formData.nim_ketua);

    if (uploadType === 'file' && selectedFile) {
      data.append('karyaFile', selectedFile);
    } else if (uploadType === 'youtube' && youtubeLink) {
      data.append('youtube_link', youtubeLink);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal update');
      }

      alert('Berhasil update data!');
      router.push('/manage');

    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl font-bold text-gray-600">Loading data...</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans relative">
      {/* [UBAH BACKGROUND] Menggunakan future.jpg */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/future.jpg"
          alt="Background Future"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        {/* Overlay gelap agar form lebih menonjol */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-20 bg-white shadow-sm">
        <Navbar />
      </div>

      <div className="relative z-10 flex justify-center py-12 px-4">
        {/* Container Form dengan backdrop blur */}
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-200/50">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 drop-shadow-sm">Edit Karya</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* [UBAH STYLE INPUT] Judul */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Judul Karya</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder:font-normal"
                required
              />
            </div>

            {/* [UBAH STYLE INPUT] Deskripsi */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={5}
                className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder:font-normal resize-none"
              />
            </div>

            {/* [UBAH STYLE INPUT] Identitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Nama Ketua</label>
                <input
                  type="text"
                  value={formData.nama_ketua}
                  onChange={(e) => setFormData({...formData, nama_ketua: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">NIM Ketua</label>
                <input
                  type="text"
                  value={formData.nim_ketua}
                  onChange={(e) => setFormData({...formData, nim_ketua: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* File / Youtube */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-3">Update File/Link (Opsional)</p>

              <div className="flex gap-6 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="type" checked={uploadType === 'file'} onChange={() => setUploadType('file')} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">File (Gambar/PDF)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="radio" name="type" checked={uploadType === 'youtube'} onChange={() => setUploadType('youtube')} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">YouTube</span>
                </label>
              </div>

              {uploadType === 'file' ? (
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-white border border-gray-300 rounded-md"
                />
              ) : (
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder:font-normal"
                />
              )}
               <p className="mt-2 text-xs text-gray-500">Biarkan kosong jika tidak ingin mengubah file/link yang sudah ada.</p>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-red-600 text-center text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-md font-bold border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSaving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}