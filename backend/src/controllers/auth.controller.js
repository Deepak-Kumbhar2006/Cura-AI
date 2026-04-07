const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 REGISTER
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const emailNorm = email ? String(email).trim().toLowerCase() : "";

        if (!emailNorm || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const existingUser = await User.findOne({ email: emailNorm });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name ? String(name).trim() : "",
            email: emailNorm,
            password: hashedPassword
        });

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// 🔐 LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailNorm = email ? String(email).trim().toLowerCase() : "";
        const user = await User.findOne({ email: emailNorm });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Server misconfigured: JWT_SECRET missing" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};