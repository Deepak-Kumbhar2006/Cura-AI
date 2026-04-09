import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

const RouterContext = createContext({
    pathname: "/",
    navigate: () => {},
});

const getPathname = () => window.location.pathname || "/";

const subscribe = (callback) => {
    window.addEventListener("popstate", callback);
    return () => window.removeEventListener("popstate", callback);
};

function usePathname() {
    return useSyncExternalStore(subscribe, getPathname, () => "/");
}

function navigateTo(path, { replace = false } = {}) {
    if (!path || path === window.location.pathname) return;
    if (replace) {
        window.history.replaceState({}, "", path);
    } else {
        window.history.pushState({}, "", path);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
}

export function Link({ to, children, onClick, ...rest }) {
    return (
        <a
            href={to}
            onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
                event.preventDefault();
                navigateTo(to);
            }}
            {...rest}
        >
            {children}
        </a>
    );
}

export function Route() {
    return null;
}

export function Routes({ children }) {
    const pathname = usePathname();
    const routeElements = Array.isArray(children) ? children : [children];
    const matched = routeElements.find(
        (route) => route?.props?.path === pathname || route?.props?.path === "*"
    );
    const value = useMemo(() => ({ pathname, navigate: navigateTo }), [pathname]);
    return (
        <RouterContext.Provider value={value}>
            {matched?.props?.element ?? null}
        </RouterContext.Provider>
    );
}

export function useNavigate() {
    const ctx = useContext(RouterContext);
    return ctx.navigate;
}

export function useLocation() {
    const ctx = useContext(RouterContext);
    return { pathname: ctx.pathname };
}
