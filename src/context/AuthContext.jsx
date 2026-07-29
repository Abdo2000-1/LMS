import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  getLandingRouteByRole,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
  watchAuthState,
} from "../lib/authService.js";
import { db } from "../services/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribe = watchAuthState((nextUser, nextToken) => {
      setToken(nextToken);

      if (!nextUser) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      unsubscribeProfile = onSnapshot(
        doc(db, "users", nextUser.uid),
        (snapshot) => {
          const profile = snapshot.exists() ? snapshot.data() : {};
          if (profile.isBlocked) {
            logoutRequest().finally(() => {
              setUser(null);
              setToken(null);
              setIsLoading(false);
            });
            return;
          }
          setUser({
            ...nextUser,
            ...profile,
            uid: nextUser.uid,
            enrolledCourses: profile.enrolledCourses || nextUser.enrolledCourses || [],
            progress: profile.progress || nextUser.progress || {},
            quizResults: profile.quizResults || nextUser.quizResults || {},
          });
          setIsLoading(false);
        },
        () => {
          setUser(nextUser);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  async function login(payload) {
    const { user: loggedInUser, token: nextToken } = await loginRequest(payload);
    setUser(loggedInUser);
    setToken(nextToken);
    return loggedInUser;
  }

  async function register(payload) {
    const { user: newUser, token: nextToken } = await registerRequest(payload);
    setUser(newUser);
    setToken(nextToken);
    return newUser;
  }

  async function updateProfile(payload) {
    const { user: updatedUser } = await updateProfileRequest(payload);
    setUser(updatedUser);
    return updatedUser;
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
    setToken(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateProfile,
      logout,
      getLandingRouteByRole,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth لازم يتستخدم جوه AuthProvider");
  return ctx;
}
