// AuraX Service Worker - Push Notifications and Caching

const CACHE_NAME = 'aurax-v2';
const urlsToCache = [
  '/',
  '/messages',
  '/toolkit',
  '/toolkit/grounding',
  '/toolkit/breathing',
  '/toolkit/affirmations',
  '/journals',
  '/journals/cbt-therapy',
  '/journals/gratitude',
  '/journals/daily-checkin',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/ryd-logo.svg',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let notificationData = {
    title: 'AuraX',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.id || notificationData.tag,
        data: payload.data || {},
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/favicon.ico',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  let url = '/';
  
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  } else if (event.notification.data) {
    // Determine URL based on notification data
    if (event.notification.data.chatId) {
      url = `/messages?chat=${event.notification.data.chatId}`;
    } else if (event.notification.data.postId) {
      url = `/social?post=${event.notification.data.postId}`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'background-sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncMessages() {
  // This would sync any pending messages when back online
  console.log('Syncing messages...');
  
  try {
    // Get pending messages from IndexedDB
    // Send them to Firebase
    // Clear from local storage
    console.log('Messages synced successfully');
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

async function syncOfflineData() {
  console.log('Syncing offline data...');
  
  try {
    // Get offline data from localStorage
    const offlineData = localStorage.getItem('aura_offline_data');
    if (offlineData) {
      const data = JSON.parse(offlineData);
      const unsyncedData = data.filter(item => !item.synced);
      
      if (unsyncedData.length > 0) {
        console.log(`Syncing ${unsyncedData.length} offline items...`);
        // The sync service will handle the actual syncing
        // This is just a trigger for the sync service
      }
    }
    console.log('Offline data sync triggered');
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}

// Message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

