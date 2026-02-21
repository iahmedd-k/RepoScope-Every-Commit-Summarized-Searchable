import { ClerkProvider } from "@clerk/nextjs";
import { RepoProvider } from "../context/Repocontext";
import "./globals.css";

export const metadata = {
  title: "RepoScope — Understand any GitHub repo instantly",
  description:
    "AI-powered GitHub commit analyzer. Get formal summaries of every commit and ask questions about your codebase in plain English.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#07080c] text-slate-200 antialiased">
          <RepoProvider>{children}</RepoProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}