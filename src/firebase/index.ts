'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// A dummy implementation for when Firebase is not configured
const createDummyService = (serviceName: string) => {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        // Throw a clear error when any method or property is accessed.
        throw new Error(
          `Firebase ${serviceName} is not available. Please ensure your Firebase environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY) are correctly set in your .env file.`
        );
      },
    }
  );
};

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Check if the essential configuration is present.
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('your_api_key')) {
    console.error(
      'Firebase configuration is missing or invalid. Please check your .env file.'
    );
    // Return dummy services that will throw an error if used.
    // This prevents the 'auth/api-key-not-valid' error and provides a more specific one.
    return {
      firebaseApp: createDummyService('App') as FirebaseApp,
      auth: createDummyService('Auth') as Auth,
      firestore: createDummyService('Firestore') as Firestore,
    };
  }

  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
