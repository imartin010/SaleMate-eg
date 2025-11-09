import type { PropsWithChildren } from 'react';
import { PublicHeader } from './PublicHeader';

export function PublicPageLayout({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Mokattam City, Cairo · +201070020058 · info@Salemate-eg.com</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">{children}</div>
      </main>
    </div>
  );
}

