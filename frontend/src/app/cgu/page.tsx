"use client";

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="max-w-2xl mx-auto px-6 py-12 text-gray-900 bg-white shadow-lg rounded-lg my-2">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">
          Conditions Générales d'Utilisation
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">1. Objet</h2>
          <p className="text-base leading-7 text-gray-600">
            Les présentes CGU régissent l'utilisation du réseau social proposé par notre plateforme.
            En accédant ou en utilisant les services, vous acceptez sans réserve ces conditions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">2. Compte utilisateur</h2>
          <p className="text-base leading-7 text-gray-600">
            Vous devez créer un compte pour utiliser certaines fonctionnalités (posts, messages, groupes...).
            Vous êtes responsable de la confidentialité de vos identifiants.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">3. Contenus partagés</h2>
          <p className="text-base leading-7 text-gray-600">
            Vous êtes seul responsable des contenus que vous publiez. Les images, textes, et autres médias
            doivent respecter la loi et les bonnes mœurs. Les administrateurs peuvent supprimer tout contenu
            non conforme.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">4. Données personnelles</h2>
          <p className="text-base leading-7 text-gray-600">
            Vous disposez à tout moment d’un droit d’accès, de rectification, de suppression et de portabilité
            de vos données. Voir notre{" "}
            <a href="/privacy-policy" className="text-blue-500 hover:underline">
              politique de confidentialité
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">5. Responsabilités</h2>
          <p className="text-base leading-7 text-gray-600">
            Nous déclinons toute responsabilité en cas de perte de données ou de dysfonctionnements, sauf cas
            de faute lourde.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-700">6. Modification des CGU</h2>
          <p className="text-base leading-7 text-gray-600">
            Nous nous réservons le droit de modifier les CGU. En cas de mise à jour, vous serez informé(e)
            et devrez les accepter à nouveau pour continuer à utiliser nos services.
          </p>
        </section>
      </div>
    </main>
  );
}