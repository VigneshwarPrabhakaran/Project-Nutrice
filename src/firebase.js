// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDL9PlW5EtkK3Q4Y9ZvKICdKAulwOyXYtA",
  authDomain: "project-nutrice.firebaseapp.com",
  projectId: "project-nutrice",
  storageBucket: "project-nutrice.firebasestorage.app",
  messagingSenderId: "437158678560",
  appId: "1:437158678560:web:f255b87d8f9c8b8bb9ec45",
  measurementId: "G-T704R6NDDK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);