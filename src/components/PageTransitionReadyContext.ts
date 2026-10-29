import { createContext } from "react";

// True once the app has mounted in the browser (App flips it in an
// effect). Kept in its own module so PageTransition.tsx only exports
// a component (react-refresh/only-export-components stays quiet).
export const PageTransitionReadyContext = createContext(false);
