import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBVtwgsR_zsiAzv8kCAOGBlgtZmUHSVRzA',
  authDomain: 'campus-connect-a6aa5.firebaseapp.com',
  databaseURL: 'https://campus-connect-a6aa5-default-rtdb.firebaseio.com',
  projectId: 'campus-connect-a6aa5',
  storageBucket: 'campus-connect-a6aa5.firebasestorage.app',
  messagingSenderId: '742784357743',
  appId: '1:742784357743:web:614e041176b0164c80449a'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
