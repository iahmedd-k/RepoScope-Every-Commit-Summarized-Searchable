import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#07080c] flex items-center justify-center">
      <SignUp />
    </div>
  );
}


