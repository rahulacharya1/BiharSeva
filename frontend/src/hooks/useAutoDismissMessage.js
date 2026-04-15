import { useEffect } from "react";

export function useAutoDismissMessage(message, setMessage, delayMs = 1000) {
  useEffect(() => {
    const hasMessage =
      typeof message === "string"
        ? message.trim().length > 0
        : Boolean(message?.text);

    if (!hasMessage) return;

    const timeoutId = setTimeout(() => {
      if (typeof message === "string") {
        setMessage("");
        return;
      }
      setMessage((prev) => ({ ...prev, text: "" }));
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [message, setMessage, delayMs]);
}
