import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useEffect, useRef } from 'react';

interface MathProps {
    formula: string;
    displayMode?: boolean;
}

export const Math = ({ formula, displayMode = false }: MathProps) => {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            katex.render(formula, containerRef.current, {
                throwOnError: false,
                displayMode: displayMode,
            });
        }
    }, [formula, displayMode]);

    return <span ref={containerRef} />;
};
