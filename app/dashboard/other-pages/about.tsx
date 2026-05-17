import Link from "next/link";

import { uiText } from "@/app/messages/uiText";


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="border-b bg-gray-50">
        <div className="mx-auto  px-6 py-20">
          <span className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600">{uiText("About The Platform")}</span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{uiText("Simple, Modern & Reliable Inventory Management")}</h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">{uiText("Built to help businesses manage inventory, purchases, suppliers, invoices, and reports with a clean and efficient workflow.")}</p>
        </div>
      </section>

      {/* Main Content */}
      <section>
        <div className="mx-auto grid  gap-10 px-6 py-16 lg:grid-cols-3">
          {/* Left Side */}
          <div className="lg:col-span-2 space-y-10">
            {/* Our Story */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("Our Story")}</h2>

              <p className="mt-4 leading-8 text-gray-600">{uiText("This platform was created with a simple goal \u2014 to make inventory management easier, faster, and more organized for growing businesses.")}</p>

              <p className="mt-4 leading-8 text-gray-600">{uiText("Many businesses still rely on spreadsheets or outdated systems to manage stock, purchases, and reports. This project aims to provide a cleaner and more modern solution that saves time and reduces operational complexity.")}</p>

              <p className="mt-4 leading-8 text-gray-600">{uiText("The platform is currently being independently designed and developed with a strong focus on usability, performance, and long-term scalability.")}</p>
            </div>

            {/* Mission */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("Mission")}</h2>

              <p className="mt-4 leading-8 text-gray-600">{uiText("Our mission is to simplify inventory operations through modern technology and intuitive design.")}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="font-semibold">{uiText("Easy To Use")}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{uiText("Designed with simplicity so businesses can focus on growth instead of complicated workflows.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="font-semibold">{uiText("Reliable Management")}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{uiText("Keep inventory, purchases, suppliers, and reports organized in one place.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="font-semibold">{uiText("Continuous Improvement")}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{uiText("The platform is actively evolving with new improvements, features, and optimizations over time.")}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="font-semibold">{uiText("Scalable Foundation")}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{uiText("Built with modern technologies to support future expansion and business needs.")}</p>
                </div>
              </div>
            </div>

            {/* Founder Note */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">{uiText("Founder Note")}</h2>

              <p className="mt-4 leading-8 text-gray-600">{uiText("This is an independently developed startup project currently being built by a solo developer.")}</p>

              <p className="mt-4 leading-8 text-gray-600">{uiText("Every feature, improvement, and update is focused on creating a practical and efficient experience for businesses managing daily inventory operations.")}</p>

              <p className="mt-4 leading-8 text-gray-600">{uiText("Thank you for supporting and being part of this journey.")}</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{uiText("Quick Information")}</h3>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{uiText("Platform Type")}</p>
                  <p className="mt-1 text-gray-600">{uiText("Inventory Management System")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Current Stage")}</p>
                  <p className="mt-1 text-gray-600">{uiText("Active Development")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Development")}</p>
                  <p className="mt-1 text-gray-600">{uiText("Independently Built")}</p>
                </div>

                <div>
                  <p className="font-medium text-gray-900">{uiText("Focus")}</p>
                  <p className="mt-1 text-gray-600">{uiText("Simplicity, Reliability & Performance")}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-black p-6 text-white shadow-sm">
              <h3 className="text-xl font-semibold">{uiText("Need Help or Have Feedback?")}</h3>

              <p className="mt-3 text-sm leading-7 text-gray-300">{uiText("Support, suggestions, and feedback are always welcome.")}</p>

              <Link
                href="/support"
                className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
              >{uiText("Contact Support")}</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}