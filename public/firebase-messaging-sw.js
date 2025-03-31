// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyAWimRWgNLcskIuA7WvlXB0V8E9lO5P7E8",
    authDomain: "trend-watcher-pro.firebaseapp.com",
    projectId: "trend-watcher-pro",
    storageBucket: "trend-watcher-pro.firebasestorage.app",
    messagingSenderId: "929055926076",
    appId: "1:929055926076:web:e2da93da2f8f0253da6039"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png' // Change to your icon path
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});