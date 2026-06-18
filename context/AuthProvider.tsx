import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import axiosConfig, { getAuthHeader } from '../helpers/axiosConfig';
import { getUser, removeUser, setUser as setUserStorage } from '../helpers/tokenStorage';

type User = {
  token: string;
  id: number;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  error: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  error: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const parsed = await getUser();
        if (!mounted) return;
        if (parsed) {
          setUser(parsed as User);
          if (parsed?.token) {
            axiosConfig.defaults.headers.common.Authorization = getAuthHeader(parsed.token);
          }
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosConfig.post('/login', {
        email,
        password,
        device_name: 'mobile',
      });

      const userResponse: User = {
        token: response.data?.token,
        id: response.data?.user?.id,
        ...response.data?.user,
      };

      setUser(userResponse);
      axiosConfig.defaults.headers.common.Authorization = getAuthHeader(userResponse.token);
      await setUserStorage(userResponse);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.[Object.keys(e?.response?.data?.errors ?? {})?.[0]]?.[0] ||
        'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (user?.token) {
        axiosConfig.defaults.headers.common.Authorization = getAuthHeader(user.token);
      }

      try {
        await axiosConfig.post('/logout');
      } catch {
        // ignore network errors during logout
      }

      setUser(null);
      delete axiosConfig.defaults.headers.common.Authorization;
      await removeUser();
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  const value = useMemo(
    () => ({ user, setUser, error, isLoading, login, logout }),
    [user, error, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
