"use client";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-3xl mx-auto px-6 py-12 bg-white shadow-lg rounded-xl text-gray-900 my-2">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">
          Politique de Confidentialité
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">1. Collecte des données</h2>
          <p className="text-base leading-7 text-gray-600">
            Nous collectons des données lorsque vous créez un compte, publiez du contenu, interagissez avec
            d’autres utilisateurs ou utilisez nos services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">2. Données collectées</h2>
          <ul className="list-disc pl-6 space-y-2 text-base leading-7 text-gray-600">
            <li>Nom, pseudo, adresse e-mail</li>
            <li>Contenus publiés (posts, images, commentaires, messages)</li>
            <li>Interactions (likes, follow, etc.)</li>
            <li>Adresse IP et logs de connexion</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">3. Utilisation des données</h2>
          <p className="text-base leading-7 text-gray-600">
            Vos données servent à faire fonctionner le service, personnaliser votre expérience, assurer la sécurité
            et respecter nos obligations légales.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">4. Vos droits</h2>
          <p className="text-base leading-7 text-gray-600">
            Conformément au RGPD, vous pouvez demander l&apos;accès, la modification, la suppression ou la portabilité
            de vos données. Pour cela, faites-le via votre profil.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">5. Conservation</h2>
          <p className="text-base leading-7 text-gray-600">
            Vos données sont conservées tant que votre compte est actif, ou selon les durées légales applicables.
            Vous pouvez supprimer votre compte à tout moment.
          </p>
        </section>
      </div>
      </main>
  );
}