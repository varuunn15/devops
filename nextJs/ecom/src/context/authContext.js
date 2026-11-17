"use client";

import { api } from "@/lib/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

let Auth = createContext();

export let AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    setLoading(true);
    const token = window.localStorage.getItem("accessToken");

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentUser = res.data;
      setUser(currentUser);
      return currentUser;
    } catch {
      window.localStorage.removeItem("accessToken");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const token = window.localStorage.getItem("accessToken");

      if (!token) {
        await Promise.resolve();
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setUser(res.data);
      } catch {
        window.localStorage.removeItem("accessToken");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadUser();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Auth.Provider value={{ user, setUser, loading, hydrateUser }}>
      {children}
    </Auth.Provider>
  );
};

export let useAuth = () => useContext(Auth);
