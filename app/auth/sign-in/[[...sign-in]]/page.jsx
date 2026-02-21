import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#07080c] flex items-center justify-center">
      <SignIn />
    </div>
  );
}