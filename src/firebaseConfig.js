import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  update,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDNrkrEBvrFqHqyj_Y_WBfXge6cilx5roo",
  authDomain: "grandipossibilit.firebaseapp.com",
  databaseURL:
    "https://grandipossibilit-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grandipossibilit",
  storageBucket: "grandipossibilit.firebasestorage.app",
  messagingSenderId: "150638030730",
  appId: "1:150638030730:web:1d358d488475f0b79aa273",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, onValue, push, update };
