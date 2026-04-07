import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            await API.post("/api/auth/register", form);

            alert("Registered successfully");
            navigate("/login");
        } catch (err) {
            alert(err?.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="auth">
            <h2>Register</h2>

            <input
                placeholder="Name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
            />

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

            <button
                className="primary-btn"
                onClick={handleRegister}
                type="button"
            >
                Register
            </button>

            <p onClick={() => navigate("/login")}>
                Already have an account? Login
            </p>
        </div>
    );
}