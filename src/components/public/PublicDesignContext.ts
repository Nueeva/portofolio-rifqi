import { createContext, useContext } from "react";

export const PublicDesignContext = createContext<{
  isPublic: boolean;
  portalContainer?: HTMLDivElement;
}>({ isPublic: false });

export const usePublicDesign = () => useContext(PublicDesignContext);
