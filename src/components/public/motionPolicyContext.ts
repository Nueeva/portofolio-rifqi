import { createContext, useContext } from "react";
export interface MotionPolicy {
    reduced: boolean;
    allowWebGL: boolean;
}
export const MotionPolicyContext = createContext<MotionPolicy>({ reduced: true, allowWebGL: false });
export const useMotionPolicy = () => useContext(MotionPolicyContext);
