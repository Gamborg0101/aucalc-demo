import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, parseAccessToken } from "@/lib/access";
import { Nav } from "./_components/Nav";
import { Footer } from "./_components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frikøbsberegner",
  description: "Frikøbsberegner for forskningskonsulenter på Faculty of Arts, Aarhus Universitet.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = parseAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);

  return (
    <html
      lang="da"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Runs synchronously during HTML parsing, before first paint — sets
            data-theme from the stored preference (falling back to the OS
            preference) so there's no flash of the wrong theme. See
            ThemeToggle.tsx for the client-side half of this. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("theme");' +
              'if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}' +
              'document.documentElement.setAttribute("data-theme",t)}catch(e){}})()',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow-lg dark:focus:bg-zinc-900 dark:focus:text-zinc-100"
        >
          Spring til indhold
        </a>
        {session && <Nav userName={session.name} />}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
