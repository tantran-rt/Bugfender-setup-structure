import { useEffect, useRef, useCallback } from 'react';

export function usePolling(callback: () => Promise<void>, interval: number) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPolling = useRef<boolean>(false); // To avoid overlapping calls

    const startPolling = useCallback(() => {
        if (intervalRef.current === null) {
            intervalRef.current = setInterval(async () => {
                if (!isPolling.current) {
                    isPolling.current = true;
                    try {
                        await callback();
                    } finally {
                        isPolling.current = false;
                    }
                }
            }, interval);
        }
    }, [callback, interval]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        startPolling();

        return () => {
            stopPolling();
        };
    }, [startPolling, stopPolling]);

    return { startPolling, stopPolling };
}
