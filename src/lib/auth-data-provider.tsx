import type { Session, User } from "@supabase/supabase-js";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { supabase } from "./supabase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) throw new Error("Missing VITE_CONVEX_URL");

export { supabase };
const convex = new ConvexReactClient(convexUrl);

export type AccountPreferences = { volume: number; speed: number };
const DEFAULT_PREFERENCES: AccountPreferences = { volume: 1, speed: 1 };

const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  preferences: AccountPreferences;
  savePreference: (patch: Partial<AccountPreferences>) => Promise<void>;
  signOut: () => Promise<void>;
}>({ user: null, isLoading: true, preferences: DEFAULT_PREFERENCES, savePreference: async () => {}, signOut: async () => {} });

export const useAppAuth = () => useContext(AuthContext);

function useSupabaseAuth() {
  const { user, isLoading } = useAppAuth();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken)
        return (await supabase.auth.refreshSession()).data.session?.access_token ?? null;
      return (await supabase.auth.getSession()).data.session?.access_token ?? null;
    },
    [],
  );

  return useMemo(
    () => ({ isLoading, isAuthenticated: Boolean(user), fetchAccessToken }),
    [user, isLoading, fetchAccessToken],
  );
}

export function AuthDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const metadataPreferences = session?.user.user_metadata?.preferences;
  const preferences: AccountPreferences = {
    volume: Number.isFinite(metadataPreferences?.volume) ? Math.min(1, Math.max(0, metadataPreferences.volume)) : DEFAULT_PREFERENCES.volume,
    speed: Number.isFinite(metadataPreferences?.speed) ? Math.min(2, Math.max(0.5, metadataPreferences.speed)) : DEFAULT_PREFERENCES.speed,
  };

  const savePreference = async (patch: Partial<AccountPreferences>) => {
    if (!session) return;
    const next = { ...preferences, ...patch };
    const { error } = await supabase.auth.updateUser({ data: { preferences: next } });
    if (error) throw error;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isLoading,
      preferences,
      savePreference,
      signOut: async () => void (await supabase.auth.signOut()),
    }),
    [session, isLoading, preferences.volume, preferences.speed],
  );

  return (
    <AuthContext.Provider value={value}>
      <ConvexProviderWithAuth client={convex} useAuth={useSupabaseAuth}>
        {children}
      </ConvexProviderWithAuth>
    </AuthContext.Provider>
  );
}
