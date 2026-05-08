import "../globals.css";
import { translations } from "@/lib/translations";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = translations[lang] || translations.tr;

  return {
    title: t.seoTitle || "OX Cloner",
    description: t.seoDescription || "Premium Discord Server Copy Engine",
    keywords: "Discord Cloner, OX Cloner, Discord Server Copy, Discord Backup, Discord Tool, Server Cloner",
    robots: "index, follow",
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'tr': '/tr',
        'en': '/en',
        'es': '/es',
        'fr': '/fr',
        'de': '/de',
        'pt': '/pt',
        'it': '/it',
      },
    },
  };
}

export async function generateStaticParams() {
  return ['tr', 'en', 'es', 'fr', 'de', 'pt', 'it'].map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  return (
    <html lang={lang || "en"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
