import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import NextAuthProvider from "./NextAuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ken Burns Effect Tool",
  description:
    "A tool to create Ken Burns effect videos from static images on Wikimedia Commons and NC Commons.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
