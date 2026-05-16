// app/faq/page.tsx

"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { uiText } from "@/app/messages/uiText";


const faqs = [
  {
    question: uiText("What does this platform do?"),
    answer: uiText("This platform helps businesses manage inventory, stock tracking, purchases, suppliers, invoices, and reports in a modern and organized way."),
  },
  {
    question: uiText("Is this platform suitable for small businesses?"),
    answer: uiText("Yes. The platform is designed to be simple, flexible, and easy to use for small and growing businesses."),
  },
  {
    question: uiText("Do I need to install anything?"),
    answer: uiText("No. The platform is web-based, so it can be accessed directly through a supported browser."),
  },
  {
    question: uiText("Can I manage multiple products and suppliers?"),
    answer: uiText("Yes. You can organize inventory, suppliers, purchases, and stock records from a centralized dashboard."),
  },
  {
    question: uiText("Is my data secure?"),
    answer: uiText("Reasonable security practices are implemented to help protect user information and business data. However, users should also maintain secure passwords and account practices."),
  },
  {
    question: uiText("Can I export reports or inventory data?"),
    answer: uiText("Yes. The platform supports report generation and data-related management features depending on available functionality."),
  },
  {
    question: uiText("Is the platform still under development?"),
    answer: uiText("Yes. The platform is actively evolving with continuous improvements, optimizations, and feature updates."),
  },
  {
    question: uiText("Who is building this platform?"),
    answer: uiText("This is currently an independently developed startup project being built and maintained by a solo developer."),
  },
  {
    question: uiText("How can I report bugs or request features?"),
    answer: uiText("You can contact support through the support page for bug reports, feedback, and feature suggestions."),
  },
  {
    question: uiText("Will more features be added in the future?"),
    answer: uiText("Yes. Future updates may include additional business tools, analytics, automation features, and performance improvements."),
  },
];

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const answerId = useId();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={answerId}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <h3 className="text-base font-semibold md:text-lg">
          {question}
        </h3>

        <ChevronDown
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          size={20}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={answerId} className="border-t border-gray-100 px-6 pb-6 pt-4">
          <p className="leading-8 text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600">{uiText("Help Center")}</span>

          <h1 className="mt-6 text-4xl font-bold md:text-5xl">{uiText("Frequently Asked Questions")}</h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">{uiText("Find answers to common questions about the platform, features, support, and development status.")}</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-black px-8 py-12 text-center text-white shadow-sm">
            <h2 className="text-3xl font-bold">{uiText("Still Have Questions?")}</h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-300">{uiText("If you could not find the answer you were looking for, feel free to contact support for additional help, feedback, or technical assistance.")}</p>

            <a
              href="/support"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
            >{uiText("Contact Support")}</a>
          </div>
        </div>
      </section>
    </main>
  );
}