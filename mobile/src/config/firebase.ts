// Firebase Configuration
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAdapALu0uxSKdL9_Ew99x08Y8SL-wavGY',
  authDomain: 'sendikaapp.firebaseapp.com',
  projectId: 'sendikaapp',
  storageBucket: 'sendikaapp.firebasestorage.app',
  messagingSenderId: '805647677578',
  appId: '1:805647677578:web:23d23ce84d8e1fd2a49573',
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
