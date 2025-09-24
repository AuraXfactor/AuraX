import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuraPointsWidget from "@/components/AuraPointsWidget";
import type { ReactNode } from 'react';

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
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aura X" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-fun">
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <AuraPointsWidget />
          </ThemeProvider>
        </AuthProvider>
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }

            var deferredPrompt; 
            function showInstallBanner(){
              var banner = document.getElementById('install-banner');
              if (!banner) return;
              banner.style.display = 'flex';
              wireInstallButtons();
            }
            function hideInstallBanner(){
              var banner = document.getElementById('install-banner');
              if (!banner) return;
              banner.style.display = 'none';
            }
            window.addEventListener('beforeinstallprompt', function(e){
              e.preventDefault();
              deferredPrompt = e;
              showInstallBanner();
            });
            window.addEventListener('appinstalled', function(){
              deferredPrompt = null;
              hideInstallBanner();
            });
            window.acceptInstall = function(){
              if (!deferredPrompt) return;
              deferredPrompt.prompt();
              deferredPrompt.userChoice.finally(function(){
                hideInstallBanner();
              });
            }
            window.dismissInstall = function(){ hideInstallBanner(); }
            function wireInstallButtons(){
              var acceptBtn = document.getElementById('install-accept');
              var dismissBtn = document.getElementById('install-dismiss');
              if (acceptBtn && !acceptBtn.getAttribute('data-wired')) {
                acceptBtn.addEventListener('click', function(){ if (window.acceptInstall) window.acceptInstall(); });
                acceptBtn.setAttribute('data-wired','1');
              }
              if (dismissBtn && !dismissBtn.getAttribute('data-wired')) {
                dismissBtn.addEventListener('click', function(){ if (window.dismissInstall) window.dismissInstall(); });
                dismissBtn.setAttribute('data-wired','1');
              }
            }
            // Fallback: if already installable but no event fired (some browsers), try showing after delay
            setTimeout(function(){
              if (!window.matchMedia('(display-mode: standalone)').matches) {
                var banner = document.getElementById('install-banner');
                if (banner && banner.dataset.autoshow === 'true') banner.style.display = 'flex';
                wireInstallButtons();
              }
            }, 2000);
            // Wire immediately in case the banner is pre-rendered
            wireInstallButtons();
          })();
        `}} />
        <div id="install-banner" data-autoshow="true" style={{display:'none',position:'fixed',bottom:16,left:16,right:16,zIndex:50,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)',border:'1px solid rgba(14,165,233,0.3)',boxShadow:'0 10px 30px rgba(14,165,233,0.25)',borderRadius:16,padding:12,alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/ryd-logo.svg" alt="Aura X" style={{width:32,height:32}}/>
            <div>
              <div style={{fontWeight:800}}>Install Aura X</div>
              <div style={{fontSize:12,opacity:0.8}}>Get a faster, fullscreen app experience</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button id="install-dismiss" style={{padding:'8px 12px',borderRadius:999,border:'1px solid rgba(14,165,233,0.2)',background:'transparent'}}>Not now</button>
            <button id="install-accept" style={{padding:'8px 14px',borderRadius:999,background:'#0ea5e9',color:'#fff',boxShadow:'0 4px 12px rgba(14,165,233,0.5)'}}>Install</button>
          </div>
        </div>
      </body>
    </html>
  );
}
