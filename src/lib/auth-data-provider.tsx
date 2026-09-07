import { createClient, type Session, type User } from "@supabase/supabase-js";
import { ConvexProviderWithAuth } from "convex/react";
import { ConvexReactClient } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
if (!supabaseKey) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
if (!convexUrl) throw new Error("Missing VITE_CONVEX_URL");

export const supabase = createClient(supabaseUrl, supabaseKey);
const convex = new ConvexReactClient(convexUrl);

const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}>({ user: null, isLoading: true, signOut: async () => {} });

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
      signOut: async () => void (await supabase.auth.signOut()),
    }),
    [session, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      <ConvexProviderWithAuth client={convex} useAuth={useSupabaseAuth}>
        {children}
      </ConvexProviderWithAuth>
    </AuthContext.Provider>
  );
}
