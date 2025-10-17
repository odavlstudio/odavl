import * as React from "react";

// Toast context and provider for global toasts
// @ts-nocheck
export type Toast = {
    id: string;
    title: string;
    description?: string;
    variant?: "default" | "success" | "error" | "warning";
    duration?: number;
};

const ToastContext = React.createContext<{
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
} | null>(null);

const [toasts, setToasts] = React.useState<Toast[]>([]);

const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3500);
}, []);

// Listen for global toast events
React.useEffect(() => {
    // @ts-ignore
    window.__odavl_toast = addToast;
    const handler = (e: CustomEvent) => {
        if (e.detail) addToast(e.detail);
    };
    window.addEventListener('odavl-toast', handler as EventListener);
    return () => {
        // @ts-ignore
        window.__odavl_toast = undefined;
        window.removeEventListener('odavl-toast', handler as EventListener);
    };
}, [addToast]);

return (
    <ToastContext.Provider value= {{ toasts, addToast }}>
        { children }
        < div className = "fixed z-50 bottom-6 right-6 flex flex-col gap-2" >
        {
            toasts.map((toast) => {
                const getBg = (variant?: string) => {
                    switch (variant) {
                        case "success": return "bg-emerald-600";
                        case "error": return "bg-rose-600";
                        case "warning": return "bg-amber-600";
                        default: return "bg-slate-800";
                    }
                };
                return (
                    <div
              key= { toast.id }
                className = {`rounded shadow-lg px-4 py-3 text-white animate-fade-in-up ${getBg(toast.variant)}`
            }
              style = {{ minWidth: 240 }}
            >
            <div className="font-semibold" > { toast.title } </div>
{ toast.description && <div className="text-sm opacity-80" > { toast.description } </div> }
</div>
          );
        })}
</div>
    </ToastContext.Provider>
  );
};

export function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx.addToast;
}

// Simple helper for direct import
export const toast = (opts: Omit<Toast, "id">) => {
    if (typeof window !== "undefined") {
        // @ts-ignore
        window.__odavl_toast?.(opts);
    }
};

// To be called in _app or root layout
export function registerGlobalToast(addToast: (opts: Omit<Toast, "id">) => void) {
    if (typeof window !== "undefined") {
        // @ts-ignore
        window.__odavl_toast = addToast;
    }
}
