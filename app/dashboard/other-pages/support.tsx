// app/support/page.tsx

"use client";

import { Mail, MessageSquare, Bug, HelpCircle } from "lucide-react";

import { uiText } from "@/app/messages/uiText";


export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600">{uiText("Support")}</span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{uiText("Need Help or Have Feedback?")}</h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">{uiText("Support, suggestions, bug reports, and feedback are always welcome. Since the platform is actively evolving, user feedback plays an important role in improving the experience.")}</p>
        </div>
      </section>

      {/* Main Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left Side */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("Contact Support")}</h2>

              <p className="mt-4 leading-8 text-gray-600">{uiText("If you are facing issues, have feature suggestions, or need help using the platform, feel free to reach out directly.")}</p>

              <div className="mt-8 flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="rounded-lg bg-black p-3 text-white">
                  <Mail size={20} aria-hidden="true" />
                </div>

                <div>
                  <p className="font-semibold">{uiText("Email Support")}</p>

                  <p className="mt-1 text-gray-600">{uiText("support@yourdomain.com")}</p>

                  <p className="mt-2 text-sm text-gray-500">{uiText("Average response time: 24\u201372 hours")}</p>
                </div>
              </div>
            </div>

            {/* Support Categories */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("What Can We Help With?")}</h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-black p-2 text-white">
                      <HelpCircle size={18} aria-hidden="true" />
                    </div>

                    <h3 className="font-semibold">{uiText("General Support")}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">{uiText("Questions about features, usage, workflows, or platform functionality.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-black p-2 text-white">
                      <Bug size={18} aria-hidden="true" />
                    </div>

                    <h3 className="font-semibold">{uiText("Bug Reports")}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">{uiText("Found an issue or unexpected behavior? Report it to help improve the platform.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-black p-2 text-white">
                      <MessageSquare size={18} aria-hidden="true" />
                    </div>

                    <h3 className="font-semibold">{uiText("Feedback & Suggestions")}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">{uiText("Share ideas, improvements, or feature requests for future updates.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-black p-2 text-white">
                      <Mail size={18} aria-hidden="true" />
                    </div>

                    <h3 className="font-semibold">{uiText("Business Inquiries")}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">{uiText("Contact regarding collaborations, integrations, or business opportunities.")}</p>
                </div>
              </div>
            </div>

            {/* Transparency Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("Independent Development")}</h2>

              <p className="mt-4 leading-8 text-gray-600">{uiText("This platform is currently being independently developed and maintained as a solo startup project.")}</p>

              <p className="mt-4 leading-8 text-gray-600">{uiText("While support resources may be limited during early development, every effort is made to improve the platform and respond to user feedback as efficiently as possible.")}</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{uiText("Support Information")}</h3>

              <div className="mt-6 space-y-5 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{uiText("Support Availability")}</p>

                  <p className="mt-1 text-gray-600">{uiText("Online Email Support")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Response Time")}</p>

                  <p className="mt-1 text-gray-600">{uiText("Usually within 24\u201372 hours")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Platform Status")}</p>

                  <p className="mt-1 text-gray-600">{uiText("Active Development")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Support Type")}</p>

                  <p className="mt-1 text-gray-600">{uiText("Independent / Solo Support")}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-black p-6 text-white shadow-sm">
              <h3 className="text-xl font-semibold">{uiText("Your Feedback Matters")}</h3>

              <p className="mt-3 text-sm leading-7 text-gray-300">{uiText("Suggestions and feedback help shape future updates and improve the platform experience.")}</p>

              <a href="mailto:support@yourdomain.com" className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200">{uiText("Contact Support")}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}