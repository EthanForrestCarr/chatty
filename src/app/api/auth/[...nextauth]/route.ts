import NextAuth from "next-auth/next";               // use the App Router entrypoint
import type { AuthOptions } from "next-auth";        // types still come from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),

    // Use JWT-based sessions
    session: {
        strategy: "jwt",
    },

    // Configure “credentials” (email + password) provider
    providers: [
        CredentialsProvider({
            name: "Email / Password",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                // return any user object—NextAuth will omit sensitive fields
                return { id: user.id, email: user.email, name: user.username };
            },
        }),
    ],

    // Custom auth pages
    pages: {
        signIn: "/login",
        newUser: "/signup",
    },

    // Callbacks to include `id` on the session.user
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },

    // Must have a secret for JWT
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);               // now NextAuth is a function, not undefined
export { handler as GET, handler as POST };
