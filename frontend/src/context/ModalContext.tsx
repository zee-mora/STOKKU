import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "full";

export type ModalOptions = {
    title?: React.ReactNode;
    size?: ModalSize;
    closable?: boolean; 
    backdropClose?: boolean; 
    className?: string; 
    contentClassName?: string; 
    footer?: React.ReactNode; 
    onClose?: () => void;
};

type ModalItem = {
    id: string;
    content: React.ReactNode;
    options?: ModalOptions;
};

function genId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultStyles: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
    },
    modal: {
        background: "#fff",
        borderRadius: 8,
        maxWidth: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        position: "relative",
    },
    header: {
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    body: {
        padding: 16,
    },
    footer: {
        padding: "12px 16px",
        borderTop: "1px solid #eee",
        textAlign: "right",
    },
    closeBtn: {
        background: "transparent",
        border: "none",
        fontSize: 18,
        cursor: "pointer",
        lineHeight: 1,
    },
};

function sizeToStyle(size?: ModalSize): React.CSSProperties {
    switch (size) {
        case "sm":
            return { width: 360 };
        case "md":
            return { width: 640 };
        case "lg":
            return { width: 960 };
        case "full":
            return { width: "100%", height: "100%", borderRadius: 0 };
        default:
            return { width: 640 };
    }
}

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modals, setModals] = useState<ModalItem[]>([]);

    const show = useCallback((content: React.ReactNode, options?: ModalOptions) => {
        const id = genId();
        setModals((prev) => [...prev, { id, content, options }]);
        return id;
    }, []);

    const close = useCallback((id?: string) => {
        setModals((prev) => {
            if (!id) {
                const last = prev[prev.length - 1];
                if (!last) return prev;
                last.options?.onClose?.();
                return prev.slice(0, -1);
            }
            const idx = prev.findIndex((m) => m.id === id);
            if (idx === -1) return prev;
            const item = prev[idx];
            item.options?.onClose?.();
            return prev.filter((m) => m.id !== id);
        });
    }, []);

    return (
        <ModalContext.Provider value={{ show, close }}>
            {children}
            {typeof document !== "undefined" &&
                modals.map((m) =>
                    ReactDOM.createPortal(
                        <ModalInstance key={m.id} item={m} onClose={() => close(m.id)} />,
                        document.body
                    )
                )}
        </ModalContext.Provider>
    );
};

function ModalInstance({ item, onClose }: { item: ModalItem; onClose: () => void }) {
    const { content, options } = item;
    const {
        title,
        size,
        closable = true,
        backdropClose = true,
        className,
        contentClassName,
        footer,
    } = options || {};

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && backdropClose) onClose();
    };

    return (
        <div style={defaultStyles.overlay} onMouseDown={handleBackdropClick}>
            <div
                role="dialog"
                aria-modal="true"
                className={className}
                style={{ ...defaultStyles.modal, ...sizeToStyle(size) }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {(title || closable) && (
                    <div style={defaultStyles.header}>
                        <div>{title}</div>
                        {closable && (
                            <button
                                aria-label="Close"
                                onClick={onClose}
                                style={defaultStyles.closeBtn}
                                title="Close"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
                <div className={contentClassName} style={defaultStyles.body}>
                    {content}
                </div>
                {footer !== undefined && <div style={defaultStyles.footer}>{footer}</div>}
            </div>
        </div>
    );
}

const ModalContext = React.createContext<{
    show: (content: React.ReactNode, options?: ModalOptions) => string;
    close: (id?: string) => void;
}>({
    show: () => "",
    close: () => {},
});

export { ModalContext };