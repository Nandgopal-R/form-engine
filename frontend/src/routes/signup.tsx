import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid generic email").refine((email) => email.endsWith("@gmail.com"), {
        message: "Enter a valid Gmail address",
    }),
    password: z.string().min(8, "Password must be at least 8 characters")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[!@#$%^&*]/, "Password must contain a special character"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const Route = createFileRoute('/signup')({
    component: Signup,
})

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [strength, setStrength] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isValidGmail = email.endsWith("@gmail.com");

    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[!@#$%^&*]/.test(pwd)) score++;

        if (score === 3) return "Strong";
        if (score === 2) return "Medium";
        return "Weak";
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (!isValidGmail) {
            setError("Enter a valid Gmail address");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const validation = signupSchema.safeParse({ name, email, password, confirmPassword });
        if (!validation.success) {
            setError(validation.error.errors[0].message);
            return;
        }

        await authClient.signUp.email({
            email,
            password,
            name,
        }, {
            onRequest: () => {
                setLoading(true);
            },
            onSuccess: () => {
                alert("Account created successfully!");
                window.location.href = "/";
            },
            onError: (ctx) => {
                setLoading(false);
                if (ctx.error.status === 0 || ctx.error.message === "Failed to fetch") {
                    setError("Backend not connected (CORS/Network error).");
                } else {
                    setError(ctx.error.message);
                }
            },
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] text-[#e5e5e5]">
            <h1 className="mb-6 text-4xl font-bold tracking-wide">FormEngine</h1>

            <div className="w-full max-w-[420px] rounded-2xl bg-[#181818] p-8 shadow-2xl">
                <h2 className="mb-1.5 text-2xl font-bold">Create an account</h2>
                <p className="mb-5 text-sm text-[#a1a1aa]">
                    Enter your information below to create your account
                </p>

                {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-[13px]">Full Name</label>
                        <input
                            placeholder="Monkey D Luffy"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[13px]">Email</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 text-white placeholder-gray-500 focus:border-white focus:outline-none"
                        />
                        {email.length > 0 && !isValidGmail && (
                            <p className="mt-1 text-xs text-red-500">Enter a valid Gmail address</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[13px]">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                disabled={!isValidGmail}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setStrength(getPasswordStrength(e.target.value));
                                }}
                                className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 pr-11 text-white placeholder-gray-500 focus:border-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
                        {password.length > 0 && strength && (
                            <div className="mt-2">
                                <div className="h-1.5 w-full rounded-full bg-[#2a2a2a]">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${strength === "Strong"
                                            ? "w-full bg-green-500"
                                            : strength === "Medium"
                                                ? "w-2/3 bg-yellow-400"
                                                : "w-1/3 bg-red-500"
                                            }`}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-[#9ca3af]">Password strength: {strength}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[13px]">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                disabled={password === ""}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#121212] p-3 pr-11 text-white placeholder-gray-500 focus:border-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            {confirmPassword.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex w-full justify-center rounded-[10px] bg-[#f4f4f5] p-3 font-medium text-black transition-colors hover:bg-white disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
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
                    Sign up with Google
                </button>

                <p className="mt-4 text-center text-[13px] text-[#a1a1aa]">
                    Already have an account? <Link to="/signin" className="text-white hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
