import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { AdminLoginAttemptStatus, Role } from "@prisma/client";
import { z } from "zod";

import {
  decryptTwoFactorSecret,
  hashRecoveryCode,
  verifyTwoFactorCode,
} from "@/features/auth/lib/two-factor";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE_SECONDS = 60 * 30;
const MAX_FAILED_SIGN_INS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
  verificationCode: z.string().trim().optional(),
  recoveryCode: z.string().trim().optional(),
});

function getRequestHeader(request: unknown, name: string) {
  if (!request || typeof request !== "object" || !("headers" in request)) {
    return null;
  }

  const headers = (request as { headers?: Headers }).headers;

  return headers?.get(name) ?? null;
}

function getRequestIpAddress(request: unknown) {
  const forwardedFor = getRequestHeader(request, "x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return getRequestHeader(request, "x-real-ip");
}

function getRequestUserAgent(request: unknown) {
  return getRequestHeader(request, "user-agent");
}

async function logLoginAttempt(input: {
  email: string;
  userId?: string | null;
  status: AdminLoginAttemptStatus;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await prisma.adminLoginAttempt.create({
    data: {
      email: input.email,
      userId: input.userId ?? null,
      status: input.status,
      failureReason: input.failureReason ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsedCredentials = signInSchema.safeParse(rawCredentials);
        const ipAddress = getRequestIpAddress(request);
        const userAgent = getRequestUserAgent(request);

        if (!parsedCredentials.success) {
          await logLoginAttempt({
            email: typeof rawCredentials?.email === "string" ? rawCredentials.email : "unknown",
            status: AdminLoginAttemptStatus.FAILED,
            failureReason: "INVALID_PAYLOAD",
            ipAddress,
            userAgent,
          });

          return null;
        }

        const now = new Date();
        const admin = await prisma.user.findUnique({
          where: {
            email: parsedCredentials.data.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            mustChangePassword: true,
            twoFactorEnabled: true,
            twoFactorSecretCiphertext: true,
            twoFactorRecoveryCodeHashes: true,
            role: true,
            isActive: true,
            failedSignInCount: true,
            lockedUntil: true,
          },
        });

        if (!admin?.isActive) {
          await logLoginAttempt({
            email: parsedCredentials.data.email,
            userId: admin?.id,
            status: AdminLoginAttemptStatus.FAILED,
            failureReason: admin ? "INACTIVE_ACCOUNT" : "UNKNOWN_EMAIL",
            ipAddress,
            userAgent,
          });

          return null;
        }

        if (admin.lockedUntil && admin.lockedUntil > now) {
          await logLoginAttempt({
            email: parsedCredentials.data.email,
            userId: admin.id,
            status: AdminLoginAttemptStatus.LOCKED_OUT,
            failureReason: "LOCKOUT_ACTIVE",
            ipAddress,
            userAgent,
          });

          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsedCredentials.data.password,
          admin.passwordHash
        );

        if (!passwordMatches) {
          const failedAttempts = admin.failedSignInCount + 1;
          const lockedUntil =
            failedAttempts >= MAX_FAILED_SIGN_INS
              ? new Date(now.getTime() + LOCKOUT_WINDOW_MINUTES * 60 * 1000)
              : null;

          await prisma.user.update({
            where: { id: admin.id },
            data: {
              failedSignInCount: failedAttempts,
              lastFailedSignInAt: now,
              lockedUntil,
            },
          });

          await logLoginAttempt({
            email: parsedCredentials.data.email,
            userId: admin.id,
            status: AdminLoginAttemptStatus.FAILED,
            failureReason:
              failedAttempts >= MAX_FAILED_SIGN_INS ? "LOCKOUT_TRIGGERED" : "INVALID_PASSWORD",
            ipAddress,
            userAgent,
          });

          return null;
        }

        const isSuperAdminTwoFactorProtected =
          admin.role === Role.SUPER_ADMIN &&
          admin.twoFactorEnabled &&
          Boolean(admin.twoFactorSecretCiphertext);
        let nextRecoveryCodeHashes: string[] | undefined;

        if (isSuperAdminTwoFactorProtected) {
          const decryptedSecret = decryptTwoFactorSecret(admin.twoFactorSecretCiphertext!);
          const verificationCode = parsedCredentials.data.verificationCode ?? "";
          const recoveryCode = parsedCredentials.data.recoveryCode ?? "";
          const usesVerificationCode = verificationCode.trim().length > 0;
          const usesRecoveryCode = recoveryCode.trim().length > 0;

          if (!usesVerificationCode && !usesRecoveryCode) {
            await logLoginAttempt({
              email: parsedCredentials.data.email,
              userId: admin.id,
              status: AdminLoginAttemptStatus.FAILED,
              failureReason: "TWO_FACTOR_REQUIRED",
              ipAddress,
              userAgent,
            });

            return null;
          }

          nextRecoveryCodeHashes = admin.twoFactorRecoveryCodeHashes;

          if (usesVerificationCode) {
            const twoFactorMatches = verifyTwoFactorCode({
              secret: decryptedSecret,
              code: verificationCode,
            });

            if (!twoFactorMatches) {
              await logLoginAttempt({
                email: parsedCredentials.data.email,
                userId: admin.id,
                status: AdminLoginAttemptStatus.FAILED,
                failureReason: "INVALID_TWO_FACTOR_CODE",
                ipAddress,
                userAgent,
              });

              return null;
            }
          } else {
            const hashedRecoveryCode = hashRecoveryCode(recoveryCode);
            const matchedIndex = admin.twoFactorRecoveryCodeHashes.findIndex(
              (storedHash) => storedHash === hashedRecoveryCode
            );

            if (matchedIndex === -1) {
              await logLoginAttempt({
                email: parsedCredentials.data.email,
                userId: admin.id,
                status: AdminLoginAttemptStatus.FAILED,
                failureReason: "INVALID_RECOVERY_CODE",
                ipAddress,
                userAgent,
              });

              return null;
            }

            nextRecoveryCodeHashes = admin.twoFactorRecoveryCodeHashes.filter(
              (_hash, index) => index !== matchedIndex
            );
          }
        }

        await prisma.user.update({
          where: { id: admin.id },
          data: {
            lastLoginAt: now,
            failedSignInCount: 0,
            lastFailedSignInAt: null,
            lockedUntil: null,
            twoFactorLastVerifiedAt: isSuperAdminTwoFactorProtected ? now : undefined,
            twoFactorRecoveryCodeHashes: nextRecoveryCodeHashes,
          },
        });

        await logLoginAttempt({
          email: parsedCredentials.data.email,
          userId: admin.id,
          status: AdminLoginAttemptStatus.SUCCESS,
          ipAddress,
          userAgent,
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mustChangePassword: admin.mustChangePassword,
          role: admin.role,
          twoFactorEnabled: admin.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role as Role;
        token.mustChangePassword = Boolean(user.mustChangePassword);
        token.twoFactorEnabled = Boolean(user.twoFactorEnabled);
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub && token.role !== undefined) {
        session.user.id = token.sub;
        session.user.role = token.role as Role;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
      }

      return session;
    },
  },
});
