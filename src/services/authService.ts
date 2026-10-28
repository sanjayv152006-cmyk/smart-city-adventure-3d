import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const GUEST_STORAGE_KEY = 'quiz_city_play_as_guest';

export class AuthService {
  // Check if player is explicitly playing as guest
  public static isGuestMode(): boolean {
    try {
      return localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public static setGuestMode(active: boolean): void {
    try {
      if (active) {
        localStorage.setItem(GUEST_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch {}
  }

  // Map Firebase errors to human-friendly messages
  public static getFriendlyErrorMessage(err: unknown): string {
    if (!err) return 'An unexpected error occurred. Please try again.';
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'No account found with this email. Please create an account or verify your email.';
    }
    if (msg.includes('auth/wrong-password')) {
      return 'Incorrect password. Please try again or click "Forgot Password".';
    }
    if (msg.includes('auth/invalid-credential')) {
      return 'Invalid email or password. Please verify your details.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please log in instead.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (msg.includes('auth/missing-password')) {
      return 'Please enter a password.';
    }
    if (msg.includes('auth/too-many-requests')) {
      return 'Too many attempts. Access is temporarily paused for security. Please try again in a few minutes.';
    }
    if (msg.includes('auth/network-request-failed')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in can be enabled in Firebase Console (Authentication > Sign-in method), or you can use Google Sign-In.';
    }
    return msg.replace(/^Firebase:\s*/, '');
  }

  // Fetch or create user profile doc in Firestore
  public static async syncUserProfile(user: FirebaseUser, fallbackUsername?: string): Promise<UserProfile> {
    const userPath = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        return data;
      } else {
        const username =
          fallbackUsername ||
          user.displayName ||
          user.email?.split('@')[0] ||
          'City Architect';

        const profile: UserProfile = {
          id: user.uid,
          username,
          email: user.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userRef, profile);
        return profile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
      throw err;
    }
  }

  // Register with email and password
  public static async register(email: string, password: string, username: string): Promise<FirebaseUser> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    // Update Auth displayName
    if (username.trim()) {
      await updateProfile(user, { displayName: username.trim() }).catch(() => {});
    }

    // Save profile to Firestore
    await this.syncUserProfile(user, username.trim());
    this.setGuestMode(false);
    return user;
  }

  // Login with email and password
  public static async login(email: string, password: string): Promise<FirebaseUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await this.syncUserProfile(cred.user);
    this.setGuestMode(false);
    return cred.user;
  }

  // Sign in with Google (1-click popup)
  public static async signInWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await this.syncUserProfile(cred.user);
    this.setGuestMode(false);
    return cred.user;
  }

  // Send password reset email
  public static async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  // Sign out
  public static async logout(): Promise<void> {
    await signOut(auth);
    this.setGuestMode(true); // Return to guest status gracefully
  }

  // Auth state listener
  public static onAuthChanged(
    callback: (user: FirebaseUser | null, profile: UserProfile | null) => void
  ): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await this.syncUserProfile(user);
          callback(user, profile);
        } catch {
          callback(user, {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'Architect',
            email: user.email || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        callback(null, null);
      }
    });
  }
}
