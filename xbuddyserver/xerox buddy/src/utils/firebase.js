import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAZpr8ckQoHRgVsG_cEm84sxygxxCiVaNk",
  authDomain: "xbuddy-servers-f9261.firebaseapp.com",
  projectId: "xbuddy-servers-f9261",
  storageBucket: "xbuddy-servers-f9261.firebasestorage.app",
  messagingSenderId: "767978359345",
  appId: "1:767978359345:web:d4fd840d1f1d8f253ba310",
  measurementId: "G-0S4KZPEELQ"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function logout() {
  await signOut(auth)
}

// Save shop config to Firestore
export async function saveShopConfig(uid, config) {
  await setDoc(doc(db, 'shops', uid), config, { merge: true })
}

// Get shop config from Firestore
export async function getShopConfig(uid) {
  const snap = await getDoc(doc(db, 'shops', uid))
  return snap.exists() ? snap.data() : null
}
