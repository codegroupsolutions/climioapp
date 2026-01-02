import AuthProvider from "@/context/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";
import {Suspense} from "react";

export const metadata = {
  title: "CLIMIO - Sistema de Gestión para Aire Acondicionado",
  description: "Plataforma SaaS para administrar negocios de instalación y mantenimiento de aire acondicionado",
  keywords: "aire acondicionado, CRM, gestión, mantenimiento, instalación, facturación",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <GoogleAnalytics />
        <AuthProvider>
         <Suspense fallback={null}>
             {children}
         </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
