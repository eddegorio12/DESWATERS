import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      mustChangePassword: boolean;
      role: Role;
    };
  }

  interface User {
    mustChangePassword?: boolean;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    mustChangePassword?: boolean;
    role?: Role;
  }
}
