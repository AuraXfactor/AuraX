import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SplashScreen from "@/components/SplashScreen";

export const metadata = {
  title: "AuraX - Your Vibe, Your Tribe",
  description: "A gamified lifestyle app for mental wellness",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-fun">
        <AuthProvider>
          <SplashScreen />
          <Navbar />
          {children}
          <PWAInstallPrompt />
        </AuthProvider>
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </body>
    </html>
  );
}
