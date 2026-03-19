import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Barbearia",
  description: "Gestão inteligente para sua barbearia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} bg-zinc-50 text-zinc-900 antialiased`}
      >
        {/* Este Toaster é o que faz a mágica de flutuar as mensagens na tela */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#3f3f46",
              color: "#fff",
              borderRadius: "10px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
