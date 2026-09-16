import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const FIREBASE_AUTH_DOMAIN = "zenith-agro.firebaseapp.com"
const MOBILE_AUTH_DOMAINS = new Set([
  "instalacao-mobile.vercel.app",
  "zenith-moblie.vercel.app",
])

const currentHostname = typeof window === "undefined"
  ? ""
  : window.location.hostname.toLowerCase()

export const firebaseConfig = {
  apiKey: "AIzaSyCPLRZmZU-c_9r7qY2Lg7jsiTkByLZTrCw",
  authDomain: MOBILE_AUTH_DOMAINS.has(currentHostname)
    ? currentHostname
    : FIREBASE_AUTH_DOMAIN,
  projectId: "zenith-agro",
  storageBucket: "zenith-agro.firebasestorage.app",
  messagingSenderId: "407871329650",
  appId: "1:407871329650:web:6ae7951cf611f162ca79eb",
  measurementId: "G-1NRTD8X4JD",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
