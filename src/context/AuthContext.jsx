import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, registerRequest } from "../lib/authService.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "alostaz_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // isLoading هنا معناها "لسه بنقرأ الجلسة المحفوظة"، مش لودينج طلب تسجيل الدخول نفسه
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user ?? null);
        setToken(parsed.token ?? null);
      }
    } catch {
      // تجاهل أي خطأ في قراءة الجلسة المحفوظة، هيبقى المستخدم لسه مسجل خروج
    } finally {
      setIsLoading(false);
    }
  }, []);

  function persistSession(nextUser, nextToken) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  }

  async function login({ email, password }) {
    const { user: loggedInUser, token: newToken } = await loginRequest({
      email,
      password,
    });
    setUser(loggedInUser);
    setToken(newToken);
    persistSession(loggedInUser, newToken);
    return loggedInUser;
  }

  async function register(payload) {
    const { user: newUser, token: newToken } = await registerRequest(payload);
    setUser(newUser);
    setToken(newToken);
    persistSession(newUser, newToken);
    return newUser;
  }

  function logout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth لازم يتستخدم جوه AuthProvider");
  return ctx;
}
