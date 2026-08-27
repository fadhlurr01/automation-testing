"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  async function logout() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push("/login");
  }
  return <div className="user-menu"><button className="top-profile" onClick={() => setOpen(!open)} aria-expanded={open}>AS <ChevronDown size={14} /></button>{open && <div className="user-popover"><Link href="#profile"><UserRound size={15} />Profile</Link><Link href="#workspace"><Users size={15} />Workspace</Link><Link href="/settings"><Settings size={15} />Settings</Link><button onClick={logout}><LogOut size={15} />Logout</button></div>}</div>;
}
