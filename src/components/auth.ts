// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDuaWMh0eIJ2tdtLxYj43ij9MGSh_Yo22M",
  authDomain: "test-6977e.firebaseapp.com",
  databaseURL: "https://test-6977e-default-rtdb.firebaseio.com/",
  projectId: "test-6977e",
  storageBucket: "test-6977e.firebasestorage.app",
  messagingSenderId: "544329273038",
  appId: "1:544329273038:web:c7a31e12bec7c80741ca9f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
