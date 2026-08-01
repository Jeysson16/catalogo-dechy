import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.PUBLIC_FIREBASE_API_KEY || "AIzaSyAatVXzAYES-bKrWQDGcZqoYL_MnYy2quk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || "dechy-inventario.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "dechy-inventario",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || "dechy-inventario.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "314212389763",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.PUBLIC_FIREBASE_APP_ID || "1:314212389763:web:31b95d4a925724646d5cb6"
};

const productCatalogFirebaseConfig = {
  apiKey: import.meta.env.VITE_CATALOG_FIREBASE_API_KEY || import.meta.env.PUBLIC_CATALOG_FIREBASE_API_KEY || "AIzaSyDzPYYgwvGcYng9ddI4A8nXEpLasoMxXf4",
  authDomain: import.meta.env.VITE_CATALOG_FIREBASE_AUTH_DOMAIN || import.meta.env.PUBLIC_CATALOG_FIREBASE_AUTH_DOMAIN || "inventory-app-jey-123.firebaseapp.com",
  projectId: import.meta.env.VITE_CATALOG_FIREBASE_PROJECT_ID || import.meta.env.PUBLIC_CATALOG_FIREBASE_PROJECT_ID || "inventory-app-jey-123",
  storageBucket: import.meta.env.VITE_CATALOG_FIREBASE_STORAGE_BUCKET || import.meta.env.PUBLIC_CATALOG_FIREBASE_STORAGE_BUCKET || "inventory-app-jey-123.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_CATALOG_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.PUBLIC_CATALOG_FIREBASE_MESSAGING_SENDER_ID || "225468681713",
  appId: import.meta.env.VITE_CATALOG_FIREBASE_APP_ID || import.meta.env.PUBLIC_CATALOG_FIREBASE_APP_ID || "1:225468681713:web:af0b4bb8c73a3237520850",
};


const app = initializeApp(firebaseConfig);
const productCatalogApp =
  getApps().find((item) => item.name === "productCatalog") ||
  initializeApp(productCatalogFirebaseConfig, "productCatalog");

export const db = getFirestore(app);
export const productCatalogDb = getFirestore(productCatalogApp);
export const auth = getAuth(app);

