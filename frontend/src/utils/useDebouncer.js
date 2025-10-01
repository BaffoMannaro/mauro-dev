import { useCallback, useEffect, useRef } from 'react';

const useDebouncer = (callback, delay, dependencies) => {
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, []);

    const debouncedCallback = useCallback(
        (...args) => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay, ...dependencies]
    );

    return debouncedCallback;
};

export default useDebouncer;
