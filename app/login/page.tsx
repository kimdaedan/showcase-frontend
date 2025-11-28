'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type FormData = {
  email: string;
  password: string;
};

// Tipe respon login dari backend
type LoginSuccessResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin'; // Menambahkan tipe role
  }
};

type ErrorResponse = {
  message: string;
};

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ErrorResponse).message || 'Gagal login');
      }

      const successData = data as LoginSuccessResponse;

      // 1. Simpan Token
      if (successData.token) {
        localStorage.setItem('token', successData.token);
      }

      // 2. Simpan User Info (Nama & Role)
      if (successData.user) {
        localStorage.setItem('userName', successData.user.name);
        localStorage.setItem('userRole', successData.user.role);
      }

      setSuccess('Login berhasil! Mengarahkan...');

      // 3. Redirect Berdasarkan Role
      setTimeout(() => {
        if (successData.user.role === 'admin') {
          // Admin diarahkan ke Dashboard Verifikasi
          router.push('/dashboard');
        } else {
          // User biasa diarahkan ke Manage Karya
          router.push('/manage');
        }
      }, 1500);

    } catch (err) {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl border border-gray-100">

        <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
          Login ke Akun Anda
        </h2>
        <p className="mb-8 text-center text-sm text-gray-500">
          Silakan masuk untuk mengelola karya Anda
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
           {/* Input Email */}
           <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="nama@contoh.com"
              // Style font-semibold dan text-gray-900 agar tulisan tebal saat diketik
              className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
            />
          </div>

          {/* Input Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-gray-900 font-semibold placeholder:font-normal placeholder:text-gray-400"
            />
          </div>

          {/* Tombol Login */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sedang Masuk...' : 'Login'}
            </button>
          </div>

          {/* Pesan Error/Sukses */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 border border-red-100">
              <p className="text-center text-sm font-medium text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 border border-green-100">
              <p className="text-center text-sm font-medium text-green-600">{success}</p>
            </div>
          )}
        </form>

        {/* Link Navigasi Bawah */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center space-y-4">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
              Daftar di sini
            </Link>
          </p>

          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>

      </div>
    </div>
  );
}