import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!clerkKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
if (!convexUrl) throw new Error("Missing VITE_CONVEX_URL");

const convex = new ConvexReactClient(convexUrl);

export function AuthDataProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
