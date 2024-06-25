import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "./AppProviders";
import Script from "next/script";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ken Burns Effect Tool",
  description:
    "A tool to create Ken Burns effect videos from static images on Wikimedia Commons and NC Commons.",
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <head>
        <Script src="/CCapture.all.min.js"></Script>
      </head>
      <body className={inter.className}>
        <AppProviders>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}
