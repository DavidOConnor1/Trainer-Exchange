"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/api";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);

  // Extract email from URL query string (no useSearchParams needed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email") || "your email address";
    setEmail(emailParam);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setVerified(true);
        setTimeout(() => {
          router.push("/User");
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Poll session every 3 seconds as fallback
  useEffect(() => {
    const interval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setVerified(true);
        clearInterval(interval);
        setTimeout(() => {
          router.push("/User");
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Email Verified!
          </h1>
          <p className="text-gray-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-md w-full bg-gray-950 p-8 rounded-2xl border border-gray-800 text-center">
        <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Verify Your Email
        </h1>
        <p className="text-gray-400 mb-6">
          We sent a verification link to{" "}
          <span className="text-white font-medium">{email}</span>. Please check
          your inbox and click the link to activate your account.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Waiting for email confirmation...
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Didn't receive the email? Check your spam folder or try signing up
          again.
        </p>
      </div>
    </div>
  );
}
