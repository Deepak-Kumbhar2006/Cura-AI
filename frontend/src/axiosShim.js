const toQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    q.append(key, String(value));
  });
  const raw = q.toString();
  return raw ? `?${raw}` : "";
};

function createAxiosError(message, response, config) {
  const err = new Error(message);
  err.response = response;
  err.config = config;
  return err;
}

function create(config = {}) {
  const defaults = { baseURL: "", timeout: 0, ...config };
  const reqInterceptors = [];
  const resFulfilled = [];
  const resRejected = [];

  const request = async (inputConfig = {}) => {
    let cfg = { method: "get", headers: {}, ...defaults, ...inputConfig };

    for (const interceptor of reqInterceptors) {
      cfg = await interceptor(cfg);
    }

    const url = `${cfg.baseURL || ""}${cfg.url || ""}${toQuery(cfg.params)}`;

    const controller = cfg.timeout ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), cfg.timeout) : null;

    let response;
    try {
      response = await fetch(url, {
        method: (cfg.method || "get").toUpperCase(),
        headers: { "Content-Type": "application/json", ...(cfg.headers || {}) },
        body: cfg.data ? JSON.stringify(cfg.data) : undefined,
        signal: controller?.signal,
      });
    } catch (error) {
      if (timer) clearTimeout(timer);
      let rejectionError = createAxiosError(error.message || "Network Error", undefined, cfg);
      for (const rejectInterceptor of resRejected) {
        rejectionError = (await rejectInterceptor(rejectionError)) || rejectionError;
      }
      throw rejectionError;
    }

    if (timer) clearTimeout(timer);

    const data = await response.json().catch(() => null);
    const wrapped = { data, status: response.status, config: cfg, headers: {} };

    if (!response.ok) {
      let rejectionError = createAxiosError(`Request failed with status ${response.status}`, wrapped, cfg);
      for (const rejectInterceptor of resRejected) {
        const maybe = await rejectInterceptor(rejectionError);
        if (maybe) return maybe;
      }
      throw rejectionError;
    }

    let finalResponse = wrapped;
    for (const interceptor of resFulfilled) {
      finalResponse = (await interceptor(finalResponse)) || finalResponse;
    }
    return finalResponse;
  };

  request.interceptors = {
    request: {
      use: (fn) => reqInterceptors.push(fn),
    },
    response: {
      use: (onSuccess, onError) => {
        if (onSuccess) resFulfilled.push(onSuccess);
        if (onError) resRejected.push(onError);
      },
    },
  };

  request.get = (url, cfg = {}) => request({ ...cfg, method: "get", url });
  request.post = (url, data, cfg = {}) => request({ ...cfg, method: "post", url, data });
  request.put = (url, data, cfg = {}) => request({ ...cfg, method: "put", url, data });
  request.delete = (url, cfg = {}) => request({ ...cfg, method: "delete", url });

  return request;
}

export default { create };
