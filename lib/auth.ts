import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
          include: { classes: { where: { year: new Date().getFullYear() } } },
        });

        if (!teacher) return null;

        const isValid = await bcrypt.compare(credentials.password, teacher.password);
        if (!isValid) return null;

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          role: teacher.role,
          classId: teacher.classes[0]?.id || null,
          className: teacher.classes[0]?.name || null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.classId = (user as any).classId;
        token.className = (user as any).className;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).classId = token.classId;
        (session.user as any).className = token.className;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
};
