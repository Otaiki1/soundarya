"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
    const [message, setMessage] = useState("Processing authentication...");
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    setMessage("Authentication failed. Please try again.");
                    return;
                }

                if (data.session) {
                    setMessage("Authentication successful! Redirecting...");
                    // Redirect to dashboard or home page
                    setTimeout(() => {
                        router.push("/");
                    }, 2000);
                } else {
                    setMessage("No active session found.");
                }
            } catch (err) {
                setMessage("An error occurred during authentication.");
                console.error("Auth callback error:", err);
            }
        };

        handleAuthCallback();
    }, [router, supabase]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Uzoza
                        </h1>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
