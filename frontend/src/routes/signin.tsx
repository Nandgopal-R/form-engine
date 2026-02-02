import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

export const Route = createFileRoute('/signin')({
    component: Login,
})

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
            setError(validation.error.errors[0].message);
            return;
        }

        await authClient.signIn.email({
            email,
            password,
        }, {
            onRequest: () => {
                setLoading(true);
            },
            onSuccess: () => {
                window.location.href = "/";
            },
            onError: (ctx) => {
                setLoading(false);
                setError(ctx.error.message);
            },
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] text-[#e5e5e5]">
            <h1 className="mb-6 text-4xl font-bold tracking-wide">FormEngine</h1>

            <div className="w-full max-w-[420px] rounded-2xl bg-[#181818] p-8 shadow-2xl">
                <h2 className="mb-1.5 text-2xl font-bold">Sign in</h2>
                <p className="mb-5 text-sm text-[#a1a1aa]">
                    Enter your credentials to access your account
                </p>

                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-[13px]">Email</label>
                        <input
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[13px]">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 pr-11 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                            />
                            {password.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full justify-center rounded-[10px] bg-[#f4f4f5] p-3 font-medium text-black transition-colors hover:bg-white disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <button
                    className="mt-3 w-full rounded-[10px] border border-[#2f2f2f] bg-[#1f1f1f] p-3 font-medium text-white transition-colors hover:bg-[#2a2a2a]"
                    onClick={() => {
                        authClient.signIn.social({
                            provider: "google",
                            callbackURL: "/"
                        })
                    }}
                >
                    Sign in with Google
                </button>

                <p className="mt-4 text-center text-[13px] text-[#a1a1aa]">
                    Don’t have an account? <Link to="/signup" className="text-white hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
