import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyC8qNztSsGVqja8mtIvpgtxzfvik6yNdu0",
  authDomain: "acme-explorer-7ed09.firebaseapp.com",
  projectId: "acme-explorer-7ed09",
  storageBucket: "acme-explorer-7ed09.firebasestorage.app",
  messagingSenderId: "857980377662",
  appId: "1:857980377662:web:e26c779c0983db65a90f6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);