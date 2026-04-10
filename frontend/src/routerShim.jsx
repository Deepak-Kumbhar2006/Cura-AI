/* eslint-disable react-refresh/only-export-components */
import { Children, cloneElement, createContext, useContext, useEffect, useMemo, useState } from "react";

const RouterContext = createContext({ pathname: "/", navigate: () => {} });

const normalizePath = (path = "/") => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

const getPathname = () => {
  if (typeof window === "undefined") return "/";
  return normalizePath(window.location.hash.replace(/^#/, "") || "/");
};

function RouterProvider({ children }) {
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    const onChange = () => setPathname(getPathname());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("router:navigate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("router:navigate", onChange);
    };
  }, []);

  const navigate = (to) => {
    const next = normalizePath(to);
    if (window.location.hash !== `#${next}`) {
      window.location.hash = next;
    }
    window.dispatchEvent(new Event("router:navigate"));
  };

  const value = useMemo(() => ({ pathname, navigate }), [pathname]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function useLocation() {
  const { pathname } = useContext(RouterContext);
  return { pathname };
}

export function Link({ to, onClick, children, ...rest }) {
  const navigate = useNavigate();
  const href = `#${normalizePath(to)}`;

  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigate(to);
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
  const location = useLocation();
  const current = normalizePath(location.pathname);

  const match = Children.toArray(children).find((child) => {
    if (!child?.props?.path) return false;
    return normalizePath(child.props.path) === current;
  }) || Children.toArray(children).find((child) => normalizePath(child?.props?.path) === "/");

  return match ? cloneElement(match.props.element) : null;
}

export default {
  RouterProvider,
};

export { RouterProvider };
