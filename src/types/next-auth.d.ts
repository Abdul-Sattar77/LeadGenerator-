import type { DefaultSession } from "next-auth";

// Augment the session/JWT to carry our tenant + role claims.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: string;
    organizationId: string;
  }
}
