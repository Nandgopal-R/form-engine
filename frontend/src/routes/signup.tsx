import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import "./auth.css";

export const Route = createFileRoute('/signup')({
    component: Signup,
})

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
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

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (!isValidGmail) {
            setError("Enter a valid Gmail address");
            return;
        }

        if (!/[!@#$%^&*]/.test(password)) {
            setError("Password must contain a special character");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setError("");
        alert("Account created successfully");
    };

    return (
        <div className="auth-container">
            <h1 className="app-title">FormEngine</h1>

            <div className="auth-card">
                <h2>Create an account</h2>
                <p className="auth-subtitle">
                    Enter your information below to create your account
                </p>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSignup}>
                    <label>Full Name</label>
                    <input
                        placeholder="Monkey D Luffy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {email.length > 0 && !isValidGmail && (
                        <p className="helper-text error">Enter a valid Gmail address</p>
                    )}

                    <label>Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            disabled={!isValidGmail}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setStrength(getPasswordStrength(e.target.value));
                            }}
                        />
                        {password.length > 0 && (
                            <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? "✖" : "👁️"}
                            </span>
                        )}
                    </div>

                    {password.length > 0 && strength && (
                        <>
                            <div className="strength-bar">
                                <div
                                    className={`strength-fill ${strength === "Strong"
                                            ? "strong"
                                            : strength === "Medium"
                                                ? "medium"
                                                : "weak"
                                        }`}
                                />
                            </div>
                            <p className="helper-text">Password strength: {strength}</p>
                        </>
                    )}

                    <label>Confirm Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            disabled={password === ""}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword.length > 0 && (
                            <span
                                className="eye"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? "✖" : "👁️"}
                            </span>
                        )}
                    </div>

                    <button type="submit">Create Account</button>
                </form>

                <button className="secondary-btn">Sign up with Google</button>

                <p className="footer-text">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
