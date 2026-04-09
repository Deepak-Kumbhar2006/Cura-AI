const DEPLOYED_BACKEND_URL = "https://healthbot-k1ha.onrender.com";
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : DEPLOYED_BACKEND_URL);
const DEFAULT_HEADERS = {
    "X-Requested-With": "XMLHttpRequest",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildHeaders = (headers = {}) => {
    const token = localStorage.getItem("token");
    return {
        ...DEFAULT_HEADERS,
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const shouldStringify = (payload) =>
    payload !== undefined &&
    payload !== null &&
    typeof payload === "object" &&
    !(payload instanceof FormData);

const buildUrl = (url, params) => {
    if (!params || typeof params !== "object") return `${API_BASE_URL}${url}`;
    const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
                acc[key] = String(value);
            }
            return acc;
        }, {})
    ).toString();
    return query ? `${API_BASE_URL}${url}?${query}` : `${API_BASE_URL}${url}`;
};

const request = async (method, url, data, config = {}, retry = false) => {
    const finalHeaders = buildHeaders(config.headers);
    const requestConfig = {
        method: method.toUpperCase(),
        headers: finalHeaders,
        signal: AbortSignal.timeout(config.timeout || 15000),
    };

    if (data !== undefined) {
        requestConfig.body = shouldStringify(data) ? JSON.stringify(data) : data;
        if (shouldStringify(data) && !finalHeaders["Content-Type"]) {
            requestConfig.headers["Content-Type"] = "application/json";
        }
    }

    try {
        const response = await fetch(buildUrl(url, config.params), requestConfig);
        const contentType = response.headers.get("content-type") || "";
        const responseData = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const error = new Error("Request failed");
            error.response = { status: response.status, data: responseData };
            throw error;
        }

        return {
            data: responseData,
            status: response.status,
            headers: response.headers,
        };
    } catch (error) {
        const status = error?.response?.status;
        const isNetworkError = !status;
        const shouldRetry = isNetworkError && method.toLowerCase() === "get" && !retry;

        if (shouldRetry) {
            await delay(500);
            return request(method, url, data, config, true);
        }

        if (status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        throw error;
    }
};

const API = {
    get: (url, config) => request("get", url, undefined, config),
    post: (url, data, config) => request("post", url, data, config),
    put: (url, data, config) => request("put", url, data, config),
    patch: (url, data, config) => request("patch", url, data, config),
    delete: (url, config) => request("delete", url, undefined, config),
};

export default API;
