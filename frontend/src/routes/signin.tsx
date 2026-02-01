import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react";
import "./auth.css";

export const Route = createFileRoute('/signin')({
    component: Login,
})

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        if (!email.includes("@")) {
            setError("Enter a valid email");
            return;
        }

        setError("");
        alert("Login successful");
    };

    return (
        <div className="auth-container">
            <h1 className="app-title">FormEngine</h1>

            <div className="auth-card">
                <h2>Sign in</h2>
                <p className="auth-subtitle">
                    Enter your credentials to access your account
                </p>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleLogin}>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label>Password</label>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {password.length > 0 && (
                            <span className="eye" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? "✖" : "👁️"}
                            </span>
                        )}
                    </div>

                    <button type="submit">Sign In</button>
                </form>

                <button className="secondary-btn">Sign in with Google</button>

                <p className="footer-text">
                    Don’t have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
