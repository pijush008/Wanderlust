import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("wanderlust_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wanderlust_token");
    if (token) {
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("wanderlust_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem("wanderlust_token");
          localStorage.removeItem("wanderlust_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("wanderlust_token", data.token);
    localStorage.setItem("wanderlust_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (username, email, password) => {
    const { data } = await api.post("/auth/signup", { username, email, password });
    localStorage.setItem("wanderlust_token", data.token);
    localStorage.setItem("wanderlust_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("wanderlust_token");
    localStorage.removeItem("wanderlust_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
