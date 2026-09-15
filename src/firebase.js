// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAV_scHiCr2NgY1kE5i6v9WR_kXNP1zvhg",
  authDomain: "project-nutrice-914c6.firebaseapp.com",
  projectId: "project-nutrice-914c6",
  storageBucket: "project-nutrice-914c6.firebasestorage.app",
  messagingSenderId: "127711837566",
  appId: "1:127711837566:web:6ad8e430eb22d06630472f",
  measurementId: "G-0DN2P3N3BQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);