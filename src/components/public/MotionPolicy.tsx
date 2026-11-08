import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { MotionPolicyContext as Context } from "./motionPolicyContext";
export function MotionPolicyProvider({ children }: {
    children: ReactNode;
}) {
    const reduce = useReducedMotion();
    const [eligible, setEligible] = useState(false);
    useEffect(() => {
        const media = matchMedia("(min-width: 1024px) and (pointer: fine)");
        const connection = (navigator as Navigator & {
            connection?: EventTarget & {
                saveData?: boolean;
                effectiveType?: string;
            };
        }).connection;
        const sync = () => setEligible(media.matches && !connection?.saveData && !/^(slow-2g|2g)$/.test(connection?.effectiveType ?? ""));
        sync();
        media.addEventListener("change", sync);
        connection?.addEventListener("change", sync);
        return () => { media.removeEventListener("change", sync); connection?.removeEventListener("change", sync); };
    }, []);
    return <Context.Provider value={{ reduced: reduce !== false, allowWebGL: eligible && reduce === false }}>{children}</Context.Provider>;
}
