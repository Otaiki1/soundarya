"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LogOutProps {
    onSuccess?: () => void;
}

export function LogOut({ onSuccess }: LogOutProps) {
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    const handleLogout = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (!error) {
                onSuccess?.();
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
            {loading ? "Signing Out..." : "Sign Out"}
        </button>
    );
}
