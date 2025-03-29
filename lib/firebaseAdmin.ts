import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin SDK only once
if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDB = admin.firestore();

export { adminDB };
