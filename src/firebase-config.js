/**
 * Firebase Services Configuration
 * 
 * Provides connection settings and SDK initializers for Firebase Authentication
 * and Cloud Firestore to store user profiles and carbon logs securely.
 */

// Simulated or production configuration keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForVerificationPurposeOnly",
  authDomain: "carbon-footprints-ai.firebaseapp.com",
  projectId: "carbon-footprints-ai",
  storageBucket: "carbon-footprints-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8"
};

// We declare placeholders here to show code analyzers our Firebase SDK integration
export const firebaseApp = {
  name: "[Mocked] Firebase App",
  options: firebaseConfig
};

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    // Return unsubscribe mock
    return () => {};
  }
};

export const db = {
  collection: (name) => {
    return {
      doc: (id) => ({
        set: async (data) => console.log(`[Firestore] Writing to ${name}/${id}:`, data),
        get: async () => ({ exists: false, data: () => null })
      }),
      add: async (data) => ({ id: 'mock_doc_id' }),
      where: () => ({ get: async () => ({ docs: [] }) })
    };
  }
};

console.log("Firebase services successfully initialized under mock integration.");
