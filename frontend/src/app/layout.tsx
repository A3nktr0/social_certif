import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { ChatManagerProvider } from "@/components/chat/ChatManager";
import FloatingChatContainer from "@/components/chat/FloatingChatContainer";
// import { PresenceProvider } from "@/context/PresenceContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Network",
  description: "A social network application built with lots of love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* <PresenceProvider> */}
            <ChatManagerProvider>
              <Navbar />
              {children}
              <FloatingChatContainer />
            </ChatManagerProvider>
          {/* </PresenceProvider> */}
        </AuthProvider>
      </body>
    </html>
  );
}
