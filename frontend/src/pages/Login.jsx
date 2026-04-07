import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await API.post("/api/auth/login", form);

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            navigate("/dashboard");
        } catch (err) {
            alert(err?.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="auth">
            <h2>Login</h2>

            <input
                placeholder="Email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
            />

            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
            />

            <button className="primary-btn" onClick={handleLogin} type="button">
                Login
            </button>

            <p onClick={() => navigate("/register")}>
                Don't have an account? Register
            </p>
        </div>
    );
}