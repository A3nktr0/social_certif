"use client";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-3xl mx-auto px-6 py-12 bg-white shadow-lg rounded-xl text-gray-900 my-2">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">
          Privacy Policy
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">1. Data Collection</h2>
          <p className="text-base leading-7 text-gray-600">
            We collect data when you create an account, post content, interact with other users, or use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">2. Data Collected</h2>
          <ul className="list-disc pl-6 space-y-2 text-base leading-7 text-gray-600">
            <li>Name, username, email address</li>
            <li>Published content (posts, images, comments, messages)</li>
            <li>Interactions (likes, follows, etc.)</li>
            <li>IP address and connection logs</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">3. Use of Data</h2>
          <p className="text-base leading-7 text-gray-600">
            Your data is used to operate the service, personalize your experience, ensure security, and comply with our legal obligations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">4. Your Rights</h2>
          <p className="text-base leading-7 text-gray-600">
            In accordance with the GDPR, you can request access, modification, deletion, or portability of your data. To do so, please use your profile.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">5. Data Retention</h2>
          <p className="text-base leading-7 text-gray-600">
            Your data is retained as long as your account is active, or according to applicable legal periods. You can delete your account at any time.
          </p>
        </section>
      </div>
      </main>
  );
}
