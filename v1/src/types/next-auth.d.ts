import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      mustChangePassword: boolean;
      role: Role;
      twoFactorEnabled: boolean;
    };
  }

  interface User {
    mustChangePassword?: boolean;
    role: Role;
    twoFactorEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    mustChangePassword?: boolean;
    role?: Role;
    twoFactorEnabled?: boolean;
  }
}
