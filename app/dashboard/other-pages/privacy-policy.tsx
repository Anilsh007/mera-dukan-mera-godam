import { uiText } from "@/app/messages/uiText";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="border-b bg-gray-50">
        <div className="mx-auto  px-6 py-20">
          <span className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium text-gray-600">{uiText("Legal")}</span>

          <h1 className="mt-6 text-4xl font-bold md:text-5xl">{uiText("Privacy Policy")}</h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600">{uiText("Your privacy is important. This Privacy Policy explains how your information is collected, used, and protected when using this inventory management platform.")}</p>

          <p className="mt-4 text-sm text-gray-500">{uiText("Last updated: May 11, 2026")}</p>
        </div>
      </section>

      <section className="mx-auto  px-6 py-16">
        <div className="space-y-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold">{uiText("1. Introduction")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("This platform is an independently built inventory management system designed to help users manage stock, purchases, suppliers, invoices, reports, and related business data.")}</p>
            <p className="mt-4 leading-8 text-gray-600">{uiText("By using this service, you agree to the collection and use of information as described in this Privacy Policy.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("2. Information We Collect")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("We may collect information that you provide directly while using the platform, including account details, business information, inventory records, supplier details, purchase data, invoice data, and other information required to operate the service.")}</p>
            <p className="mt-4 leading-8 text-gray-600">{uiText("We may also collect basic technical information such as browser type, device information, IP address, usage activity, and error logs to improve performance, security, and reliability.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("3. How We Use Your Information")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("Your information is used to provide, maintain, improve, and secure the platform. This may include managing user accounts, storing inventory data, generating reports, improving features, fixing bugs, preventing misuse, and responding to support requests.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("4. Business and Inventory Data")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("The inventory, supplier, invoice, purchase, and report data you enter into the platform remains your business data. We do not sell your business data to third parties.")}</p>
            <p className="mt-4 leading-8 text-gray-600">{uiText("You are responsible for ensuring that the information you enter is accurate and that you have the right to store and process such information.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("5. Data Sharing")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("We do not sell your personal or business information. Information may only be shared when required to operate the platform, comply with legal obligations, protect the service, or with your consent.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("6. Data Security")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("Reasonable technical and organizational measures are used to help protect your information. However, no online service can guarantee complete security, and users should also take steps to protect their account credentials.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("7. Cookies and Analytics")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("The platform may use cookies or similar technologies to support authentication, improve user experience, analyze usage, and maintain security.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("8. Data Retention")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("We retain information for as long as necessary to provide the service, comply with legal obligations, resolve disputes, and improve the platform.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("9. Your Responsibilities")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("You are responsible for keeping your login details secure, maintaining accurate business records, and using the platform in a lawful and responsible manner.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("10. Changes to This Policy")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("This Privacy Policy may be updated from time to time as the platform evolves. Any changes will be posted on this page with an updated revision date.")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{uiText("11. Contact")}</h2>
            <p className="mt-4 leading-8 text-gray-600">{uiText("For questions about this Privacy Policy or how your information is handled, please contact support through the official support page.")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}