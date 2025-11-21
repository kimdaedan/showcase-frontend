// Wajib ada di paling atas
'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react'; // Impor Tipe React
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Definisikan tipe untuk data form kita
type FormData = {
  name: string;
  email: string;
  password: string;
  major: string;
};

// Definisikan tipe untuk respons error
type ErrorResponse = {
  message: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    major: '',
  });
  const [error, setError] = useState<string>(''); // Tipe string
  const [success, setSuccess] = useState<string>(''); // Tipe string
  const [isLoading, setIsLoading] = useState<boolean>(false); // Tipe boolean
  const router = useRouter();

  // Tambahkan tipe untuk event: ChangeEvent<HTMLInputElement>
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Tambahkan tipe untuk event: FormEvent<HTMLFormElement>
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.password) {
      setError('Password diperlukan');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Beri tahu TypeScript bahwa 'data' adalah ErrorResponse
        throw new Error((data as ErrorResponse).message || 'Gagal mendaftar');
      }

      setSuccess('Registrasi berhasil! Anda akan diarahkan ke halaman login...');
      setFormData({ name: '', email: '', password: '', major: '' });

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      // 'err' bisa bertipe 'unknown' atau 'any', kita perlu mengeceknya
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak diketahui');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Buat Akun Baru
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (Tidak ada perubahan pada JSX/HTML di sini) ... */}
          {/* Form Input untuk Nama */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Form Input untuk Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Form Input untuk Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Form Input untuk Jurusan */}
          <div>
            <label
              htmlFor="major"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Jurusan (Opsional)
            </label>
            <input
              type="text"
              id="major"
              name="major"
              value={formData.major}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Tombol Submit */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Mendaftar...' : 'Register'}
            </button>
          </div>
          {/* ... (Tampilan error/sukses tidak berubah) ... */}
           {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="text-center text-sm text-green-600">{success}</p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}