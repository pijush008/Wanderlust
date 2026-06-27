import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const colors = { success: "alert-success", error: "alert-danger", info: "alert-info", warning: "alert-warning" };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", top: "80px", right: "20px", zIndex: 9999, maxWidth: "380px" }}>
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${colors[t.type]} alert-dismissible shadow`} role="alert">
            {t.message}
            <button type="button" className="btn-close" onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
