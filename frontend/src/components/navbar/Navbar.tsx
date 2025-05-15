"use client";

import { useAuth } from "@/context/AuthContext";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

export default function Navbar() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  );
}
