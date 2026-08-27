"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthMode = "login" | "register" | "forgot";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        setMessage(data.session ? "Account created. Redirecting..." : "Account created. Check your email to confirm access.");
        if (data.session) router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (error) throw error;
        setMessage("Password reset instructions sent. Check your email.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your workspace" : "Reset your password";
  const subtitle = mode === "login" ? "Sign in to continue to Automation Hub." : mode === "register" ? "Start organizing your marketing workflow." : "We will send a secure reset link to your inbox.";
  return <main className="auth-page"><div className="auth-brand"><span className="brand-mark"><Sparkles size={16} /></span>Automation <b>Hub</b></div><section className="auth-card"><div className="auth-kicker">NORTHSTAR TEAM</div><h1>{title}</h1><p>{subtitle}</p><form onSubmit={submit}>{mode === "register" && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Arbi" required /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>{mode !== "forgot" && <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>}<button className="auth-submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}</button></form>{message && <p className="auth-message" role="status">{message}</p>}{mode === "login" && <div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/register">Create account</Link></span></div>}{mode === "register" && <div className="auth-links"><span>Already have an account? <Link href="/login">Sign in</Link></span></div>}{mode === "forgot" && <div className="auth-links"><Link href="/login">Back to sign in</Link></div>}</section><small className="auth-footer">Secure workspace access powered by Supabase Auth</small></main>;
}
