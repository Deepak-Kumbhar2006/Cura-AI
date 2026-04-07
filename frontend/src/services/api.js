import axios from "axios";

const DEPLOYED_BACKEND_URL = "https://healthbot-k1ha.onrender.com";
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : DEPLOYED_BACKEND_URL);

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// 🔐 Attach token automatically
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    req.headers = req.headers || {};
    req.headers["X-Requested-With"] = "XMLHttpRequest";

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const config = error?.config || {};
        const shouldRetry =
            !status &&
            config &&
            !config.__retried &&
            (config.method || "get").toLowerCase() === "get";

        if (shouldRetry) {
            config.__retried = true;
            await new Promise((resolve) => setTimeout(resolve, 500));
            return API(config);
        }

        if (status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default API;
