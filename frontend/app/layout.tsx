import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberSaaS",
  description: "Sistema de Gestão para Barbearias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* CONFIGURAÇÃO DO TOASTER (AVISOS) */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#333",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#16a34a", // Verde
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626", // Vermelho
                secondary: "#fff",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
