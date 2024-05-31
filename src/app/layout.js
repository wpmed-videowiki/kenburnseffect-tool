import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "./AppProviders";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ken Burns Effect Tool",
  description:
    "A tool to create Ken Burns effect videos from static images on Wikimedia Commons and NC Commons.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script src="/CCapture.all.min.js"></Script>
      </head>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
