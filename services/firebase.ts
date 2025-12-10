import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import {
  getMessaging,
  Messaging,
  getToken,
  onMessage
} from 'firebase/messaging';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
// Vite automatically injects these from .env.local
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Log what we're loading
console.log('[Firebase] Initializing with project:', firebaseConfig.projectId);
console.log('[Firebase] API Key present:', !!firebaseConfig.apiKey);
console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain);

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;
let db: Firestore | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    console.log('[Firebase] ✅ Firebase initialized successfully');
    console.log('[Firebase] ✅ Firestore initialized for project:', firebaseConfig.projectId);
    
    // Enable persistent authentication across browser sessions
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('Auth persistence setup failed:', err);
    });

    // Initialize Cloud Messaging (may fail in non-browser context)
    try {
      messaging = getMessaging(app);
      console.log('Firebase Cloud Messaging initialized');
    } catch (err) {
      console.warn('Cloud Messaging not available:', err);
    }
  } else {
    console.warn('[Firebase] ⚠️ Missing configuration. Running in demo mode.');
  }
} catch (err) {
  console.error('Firebase initialization failed:', err);
  console.warn('[Firebase] ⚠️ Continuing in demo mode without authentication.');
}

// Auth helpers
export const registerUser = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(`Registration failed: ${authError.message}`);
  }
};

export const loginUser = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(`Login failed: ${authError.message}`);
  }
};

export const logoutUser = async () => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(`Logout failed: ${authError.message}`);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase Auth not initialized, calling callback with null');
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => auth?.currentUser || null;

// Cloud Messaging helpers for push notifications
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Cloud Messaging not available');
    return null;
  }

  try {
    // Check if browser supports notification API
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return null;
    }

    // Request permission if not already granted
    if (Notification.permission === 'granted') {
      // Get the token
      const token = await getToken(messaging, {
        vapidKey: (import.meta as any).env.VITE_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY
      });
      return token || null;
    } else if (Notification.permission !== 'denied') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: (import.meta as any).env.VITE_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY
        });
        return token || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get notification token:', error);
    return null;
  }
};

// Listen for foreground messages
export const setupMessageListener = (callback: (message: any) => void) => {
  if (!messaging) {
    console.warn('Cloud Messaging not available');
    return () => {};
  }

  try {
    return onMessage(messaging, callback);
  } catch (error) {
    console.error('Failed to set up message listener:', error);
    return () => {};
  }
};

// Export Firestore database instance
export { db, auth, app, messaging };
