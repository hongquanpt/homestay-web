import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
 providers: [
 CredentialsProvider({
 name: "Credentials",
 credentials: {
 email: { label: "Email", type: "email", placeholder: "admin@homestay.com" },
 password: { label: "Password", type: "password" }
 },
 async authorize(credentials) {
 if (!credentials?.email || !credentials?.password) {
 throw new Error("Invalid credentials");
 }

 const user = await prisma.user.findUnique({
 where: { email: credentials.email },
 include: { role: true },
 });

 if (!user) {
 throw new Error("User not found");
 }

 const isValid = await bcrypt.compare(credentials.password, user.password);
 if (!isValid) {
 throw new Error("Incorrect password");
 }

 return {
 id: user.id,
 email: user.email,
 name: user.name,
 role: user.role.name,
 };
 }
 })
 ],
 callbacks: {
 async jwt({ token, user }) {
 if (user) {
 token.id = user.id;
 token.role = (user as any).role;
 }
 return token;
 },
 async session({ session, token }) {
 if (token) {
 session.user.id = token.id as string;
 session.user.role = token.role as string;
 }
 return session;
 }
 },
 pages: {
 signIn: "/hms-portal-9f8b2c1a/login",
 },
 session: {
 strategy: "jwt",
 },
 secret: process.env.NEXTAUTH_SECRET || "default_secret_for_development",
};
