import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-3.5 pb-5">
      <Link href="/" className="self-start py-2">
        <Wordmark size={24} />
        <span className="sr-only"> home page</span>
      </Link>
      <h1 className="mt-10 font-display text-[40px] leading-none font-extrabold">Welcome back.</h1>
      <p className="mt-3 text-[15px] text-moss">Sign in with your email or Google to open HQ.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <div className="flex-1" />
      <p className="mt-6 text-center text-sm text-moss">
        New here?{" "}
        <Link href="/quiz" className="font-semibold text-brass hov:text-brass-light">
          Find your archetype
        </Link>
      </p>
      <p className="mt-1 text-center text-sm text-moss">
        Training and placement cell?{" "}
        <Link href="/college" className="inline-flex min-h-11 items-center font-semibold text-brass hov:text-brass-light">
          Open College HQ
        </Link>
      </p>
    </main>
  );
}
