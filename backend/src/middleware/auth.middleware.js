const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        const token = auth?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!process.env.JWT_SECRET) {
            return res
                .status(500)
                .json({ message: "Server misconfigured: JWT_SECRET missing" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};