import "./globals.css";

export const metadata = {
  title: "OX Cloner | Premium Discord Server Copy Engine",
  description: "The fastest and safest Discord server cloning tool. Copy channels, roles, and emojis instantly with OX Cloner. Secure, reliable, and premium server backup solution.",
  keywords: "Discord Cloner, OX Cloner, Discord Server Copy, Discord Backup, Discord Tool, Server Cloner",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
