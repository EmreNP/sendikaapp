import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config - Values from admin panel .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAdapALu0uxSKdL9_Ew99x08Y8SL-wavGY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sendikaapp.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'sendikaapp',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sendikaapp.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '805647677578',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:805647677578:web:23d23ce84d8e1fd2a49573',
};

// Firebase config is set

// Initialize Firebase
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized with project:', firebaseConfig.projectId);
  } catch (error: any) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
} else {
  app = getApps()[0];
}

// Initialize Auth (Expo Firebase SDK handles persistence automatically)
const auth = getAuth(app);

export const db = getFirestore(app);
export { auth };
