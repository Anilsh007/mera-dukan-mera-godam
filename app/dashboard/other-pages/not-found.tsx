import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

import { uiText } from "@/app/messages/uiText";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-12">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
          <SearchX size={30} />
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{uiText("Error 404")}</p>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{uiText("Page not found")}</h1>

        <p className="mb-8 max-w-xl text-base leading-7 text-slate-600 md:text-lg">{uiText("Sorry, the page you are looking for does not exist, was moved, or the link may be incorrect.")}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Home size={18} />{uiText("Go to Dashboard")}</Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />{uiText("Back to Home")}</Link>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{uiText("Tip: Check the URL, or use the sidebar to navigate to Backup, Download, or other dashboard sections.")}</p>
        </div>
      </div>
    </main>
  );
}