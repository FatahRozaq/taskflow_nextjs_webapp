import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!privateKey) {
  throw new Error("Missing FIREBASE_PRIVATE_KEY in environment variables");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const firebaseAdmin = admin; 

export async function verifyIdToken(token: string) {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    return null;
  }
}
