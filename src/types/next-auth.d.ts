import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // Add any additional user properties here if needed
  // }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}