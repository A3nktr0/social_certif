"use client";

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl mx-auto px-6 py-12 text-gray-900 bg-white shadow-lg rounded-lg my-2">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">
          Terms and Conditions of Use
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">1. Purpose</h2>
          <p className="text-base leading-7 text-gray-600">
            These Terms and Conditions govern the use of the social network provided by our platform.
            By accessing or using the services, you unconditionally accept these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">2. User Account</h2>
          <p className="text-base leading-7 text-gray-600">
            You must create an account to use certain features (posts, messages, groups, etc.).
            You are responsible for keeping your login credentials confidential.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">3. Shared Content</h2>
          <p className="text-base leading-7 text-gray-600">
            You are solely responsible for the content you publish. Images, texts, and other media
            must comply with the law and good conduct. Administrators may remove any non-compliant content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">4. Personal Data</h2>
          <p className="text-base leading-7 text-gray-600">
            You have the right to access, rectify, delete, and transfer your data at any time. See our{" "}
            <a href="/privacy-policy" className="text-blue-500 hover:underline">
              privacy policy
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">5. Responsibilities</h2>
          <p className="text-base leading-7 text-gray-600">
            We disclaim all liability in case of data loss or malfunctions, except in cases of gross negligence.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">6. Modification of Terms</h2>
          <p className="text-base leading-7 text-gray-600">
            We reserve the right to modify these Terms and Conditions. In case of an update, you will be informed
            and must accept them again to continue using our services.
          </p>
        </section>
      </div>
    </main>
  );
}
