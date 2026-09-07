import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "authenticated",
      issuer: "https://macmhdkmkkjnfrskhwkr.supabase.co/auth/v1",
      jwks: "https://macmhdkmkkjnfrskhwkr.supabase.co/auth/v1/.well-known/jwks.json",
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
