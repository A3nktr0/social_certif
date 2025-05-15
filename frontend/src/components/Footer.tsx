"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden md:flex justify-center items-center bg-white border-t border-gray-200 shadow-sm px-6 py-3">
      <Link
        href="/cgu"
        className="hover:text-blue-600 text-gray-800"
      >
        CGU
      </Link>
      <Link
        href="/privacy-policy"
        className="hover:text-blue-600 text-gray-800 ml-6"
      >
        Politique de confidentialité
      </Link>
    </footer>
  );
}
