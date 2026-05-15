"use client";

import { createContext, useContext, ReactNode } from "react";

interface UserContextType {
  currentUserId: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  currentUserId,
}: {
  children: ReactNode;
  currentUserId: string | null;
}) {
  return (
    <UserContext.Provider value={{ currentUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  return context || { currentUserId: null };
}
