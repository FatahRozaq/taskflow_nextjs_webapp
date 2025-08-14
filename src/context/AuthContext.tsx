"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";

interface AppUser {
  userId: number;
  uid: string;
  email: string | null;
  name: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (uid: string): Promise<AppUser | null> => {
    try {
      const res = await api.get(`/auth/user/${uid}`);
      const data = res.data;
      return {
        userId: data.data.userId,
        uid: data.data.uid,
        email: data.data.email,
        name: data.data.name,
      };
    } catch (err) {
      console.error("Fetch user error:", err);
      return null;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await fetchUserData(firebaseUser.uid);
        if (appUser) {
          setUser(appUser);
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: "", userId: 0 });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setSessionCookie = async (token: string) => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  };

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await setSessionCookie(token);
      const appUser = await fetchUserData(cred.user.uid);
      setUser(appUser);
    } catch (error) {
      throw error;
    }

  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();

      await api.post("/auth/register", {
        token,
        uid: cred.user.uid,
        name: name || "",
        email,
      });

      await setSessionCookie(token);
      const appUser = await fetchUserData(cred.user.uid);
      setUser(appUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(auth);
      setUser(null);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};