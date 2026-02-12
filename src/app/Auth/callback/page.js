// src/app/auth/callback/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "../../../../lib-supa/v1/api";


export default function AuthCallBack() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthRedirect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // Clean URL and redirect
                window.history.replaceState({}, document.title, "/users");
                router.push("/users");
            }
        };

        handleAuthRedirect();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Completing sign in...</p>
        </div>
    );
}