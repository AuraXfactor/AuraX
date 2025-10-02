import React from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";
import SlimNavbar from "@/components/SlimNavbar";
import SmartBottomNav from "@/components/SmartBottomNav";
import AuraPointsWidget from "@/components/AuraPointsWidget";
import ClientAppWrapper from "@/components/ClientAppWrapper";
import SwipeDetector from "@/components/SwipeDetector";
import OfflineStatus from "@/components/OfflineStatus";
import type { ReactNode } from 'react';

export const metadata = {
  title: "AuraZ - Your Vibe, Your Tribe",
  description: "A gamified lifestyle app for mental wellness with journals, breathwork, and streaks",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AuraZ',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AuraZ',
  },
};

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

function AppContent({ children }: { children: ReactNode }) {
  return (
    <SwipeDetector>
      <SlimNavbar />
      {children}
      <SmartBottomNav />
      <AuraPointsWidget />
      <OfflineStatus />
    </SwipeDetector>
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA Configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AuraZ" />
        <meta name="apple-mobile-web-app-orientation" content="portrait" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icon.svg" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icon.svg" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" href="/ryd-logo.svg" />
        
        {/* Additional PWA meta tags */}
        <meta name="application-name" content="AuraZ" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Viewport for iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="bg-fun">
        <AuthProvider>
          <ThemeProvider>
            <AppContent>{children}</AppContent>
            <ClientAppWrapper>
              <div></div>
            </ClientAppWrapper>
          </ThemeProvider>
        </AuthProvider>
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            // Service Worker Registration
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }

            // PWA Install Detection and iOS-specific handling
            var deferredPrompt;
            var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            var isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            
            function showInstallBanner() {
              var banner = document.getElementById('install-banner');
              if (!banner) return;
              
              // For iOS Safari, show different instructions
              if (isIOS && isSafari) {
                var iosInstructions = document.getElementById('ios-instructions');
                var androidInstructions = document.getElementById('android-instructions');
                if (iosInstructions) iosInstructions.style.display = 'block';
                if (androidInstructions) androidInstructions.style.display = 'none';
              } else {
                var iosInstructions = document.getElementById('ios-instructions');
                var androidInstructions = document.getElementById('android-instructions');
                if (iosInstructions) iosInstructions.style.display = 'none';
                if (androidInstructions) androidInstructions.style.display = 'block';
              }
              
              banner.style.display = 'flex';
              wireInstallButtons();
            }
            
            function hideInstallBanner() {
              var banner = document.getElementById('install-banner');
              if (!banner) return;
              banner.style.display = 'none';
            }
            
            // Handle beforeinstallprompt for Android/Chrome
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              deferredPrompt = e;
              showInstallBanner();
            });
            
            // Handle app installed
            window.addEventListener('appinstalled', function() {
              deferredPrompt = null;
              hideInstallBanner();
              console.log('PWA was installed');
            });
            
            // Install functions
            window.acceptInstall = function() {
              if (isIOS && isSafari) {
                // For iOS Safari, we can't programmatically install
                // Show instructions instead
                showIOSInstallInstructions();
                return;
              }
              
              if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function(choiceResult) {
                  if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                  } else {
                    console.log('User dismissed the install prompt');
                  }
                  deferredPrompt = null;
                  hideInstallBanner();
                });
              }
            };
            
            window.dismissInstall = function() { 
              hideInstallBanner(); 
            };
            
            function showIOSInstallInstructions() {
              var instructions = document.getElementById('ios-install-modal');
              if (instructions) {
                instructions.style.display = 'flex';
              }
            }
            
            window.closeIOSInstructions = function() {
              var instructions = document.getElementById('ios-install-modal');
              if (instructions) {
                instructions.style.display = 'none';
              }
            };
            
            function wireInstallButtons() {
              var acceptBtn = document.getElementById('install-accept');
              var dismissBtn = document.getElementById('install-dismiss');
              var iosCloseBtn = document.getElementById('ios-close');
              
              if (acceptBtn && !acceptBtn.getAttribute('data-wired')) {
                acceptBtn.addEventListener('click', function() { 
                  if (window.acceptInstall) window.acceptInstall(); 
                });
                acceptBtn.setAttribute('data-wired', '1');
              }
              
              if (dismissBtn && !dismissBtn.getAttribute('data-wired')) {
                dismissBtn.addEventListener('click', function() { 
                  if (window.dismissInstall) window.dismissInstall(); 
                });
                dismissBtn.setAttribute('data-wired', '1');
              }
              
              if (iosCloseBtn && !iosCloseBtn.getAttribute('data-wired')) {
                iosCloseBtn.addEventListener('click', function() { 
                  if (window.closeIOSInstructions) window.closeIOSInstructions(); 
                });
                iosCloseBtn.setAttribute('data-wired', '1');
              }
            }
            
            // Show install banner if not already installed
            setTimeout(function() {
              if (!isInStandaloneMode && !window.matchMedia('(display-mode: standalone)').matches) {
                var banner = document.getElementById('install-banner');
                if (banner && banner.dataset.autoshow === 'true') {
                  showInstallBanner();
                }
              }
            }, 3000);
            
            // Wire buttons immediately
            wireInstallButtons();
          })();
        `}} />
        {/* Install Banner */}
        <div id="install-banner" data-autoshow="true" style={{display:'none',position:'fixed',bottom:16,left:16,right:16,zIndex:50,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',border:'1px solid rgba(14,165,233,0.3)',boxShadow:'0 10px 30px rgba(14,165,233,0.25)',borderRadius:16,padding:16,alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/icon.svg" alt="AuraZ" style={{width:40,height:40}}/>
            <div>
              <div style={{fontWeight:800,fontSize:16}}>Install AuraZ</div>
              <div style={{fontSize:12,opacity:0.8}}>Get a faster, fullscreen app experience</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button id="install-dismiss" style={{padding:'8px 12px',borderRadius:999,border:'1px solid rgba(14,165,233,0.2)',background:'transparent',fontSize:14}}>Not now</button>
            <button id="install-accept" style={{padding:'8px 16px',borderRadius:999,background:'#0ea5e9',color:'#fff',boxShadow:'0 4px 12px rgba(14,165,233,0.5)',fontSize:14,fontWeight:600}}>Install</button>
          </div>
        </div>

        {/* iOS Install Instructions Modal */}
        <div id="ios-install-modal" style={{display:'none',position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:100,background:'rgba(0,0,0,0.8)',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'white',borderRadius:20,padding:24,maxWidth:400,width:'100%',textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:16}}>📱</div>
            <h3 style={{fontSize:20,fontWeight:700,marginBottom:16,color:'#1f2937'}}>Install AuraZ on iOS</h3>
            <div style={{textAlign:'left',marginBottom:20,lineHeight:1.6,color:'#4b5563'}}>
              <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:'#0ea5e9',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>1</div>
                <span>Tap the <strong>Share</strong> button in Safari</span>
              </div>
              <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:'#0ea5e9',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>2</div>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </div>
              <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:'#0ea5e9',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>3</div>
                <span>Tap <strong>"Add"</strong> to install the app</span>
              </div>
            </div>
            <button id="ios-close" style={{padding:'12px 24px',borderRadius:12,background:'#0ea5e9',color:'white',border:'none',fontSize:16,fontWeight:600,width:'100%'}}>
              Got it!
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
