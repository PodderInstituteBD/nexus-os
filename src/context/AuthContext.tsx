import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team } from '../types';
import { apiRequest } from '../lib/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  db as firestoreDb,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  teams: Team[];
  activeTeam: Team | null;
  isLoading: boolean;
  login: (emailOrData: string | { email: string; password?: string }, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    userDataOrEmail: { email: string; password: string; fullName: string; title?: string; role?: string } | string,
    password?: string,
    fullName?: string,
    title?: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setActiveTeam: (team: Team) => void;
  refreshTeams: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus_auth_token'));
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Sync user profile with Firestore database doc
        try {
          const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              id: fbUser.uid,
              email: fbUser.email,
              fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cloud Engineer',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.email || 'user')}`,
              role: 'ADMIN',
              title: 'Principal Engineer',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('Firestore user profile sync error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
      await fetchTeams();
    } catch {
      localStorage.removeItem('nexus_auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await apiRequest<{ teams: Team[] }>('/teams');
      setTeams(data.teams);
      if (data.teams.length > 0) {
        setActiveTeam((prev) => prev || data.teams[0]);
      }
    } catch (err) {
      console.error('Failed to load teams', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Sync into Firestore
      try {
        const userDocRef = doc(firestoreDb, 'users', fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || 'Google Engineer',
          avatarUrl: fbUser.photoURL,
          role: 'ADMIN',
          title: 'Google Cloud Engineer',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fErr) {
        handleFirestoreError(fErr, OperationType.WRITE, `users/${fbUser.uid}`);
      }

      // Sync with Express backend session
      const syncRes = await apiRequest<{ user: User; token: string }>('/auth/firebase-sync', {
        method: 'POST',
        body: JSON.stringify({
          email: fbUser.email,
          fullName: fbUser.displayName,
          avatarUrl: fbUser.photoURL,
          firebaseUid: fbUser.uid
        })
      });

      localStorage.setItem('nexus_auth_token', syncRes.token);
      setToken(syncRes.token);
      setUser(syncRes.user);
      await fetchTeams();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    emailOrData: string | { email: string; password?: string },
    password = 'nexus123!'
  ) => {
    const creds = typeof emailOrData === 'string'
      ? { email: emailOrData, password }
      : { email: emailOrData.email, password: emailOrData.password || password };
    const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds)
    });
    localStorage.setItem('nexus_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchTeams();
  };

  const register = async (
    userDataOrEmail: { email: string; password: string; fullName: string; title?: string; role?: string } | string,
    password?: string,
    fullName?: string,
    title?: string,
    role?: string
  ) => {
    let payload: { email: string; password: string; fullName: string; title?: string; role?: string };
    if (typeof userDataOrEmail === 'string') {
      payload = {
        email: userDataOrEmail,
        password: password || 'nexus123!',
        fullName: fullName || userDataOrEmail.split('@')[0],
        title,
        role
      };
    } else {
      payload = userDataOrEmail;
    }

    const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('nexus_auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchTeams();
  };

  const quickLogin = async (email: string) => {
    await login(email, 'nexus123!');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    localStorage.removeItem('nexus_auth_token');
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    setTeams([]);
    setActiveTeam(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    setUser(res.user);
    if (firebaseUser) {
      try {
        const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          fullName: res.user.fullName,
          title: res.user.title,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not sync updated profile to firestore', e);
      }
    }
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isAuthenticated,
        teams,
        activeTeam,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        quickLogin,
        updateProfile,
        setActiveTeam,
        refreshTeams: fetchTeams
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
