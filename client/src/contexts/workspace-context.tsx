import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Workspace } from "@shared/schema";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[] | ((prev: Workspace[]) => Workspace[])) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load workspaces from API
  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch workspaces from API (userId is handled server-side via session)
      const response = await fetch(`/api/workspaces`);
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      
      let fetchedWorkspaces: Workspace[] = await response.json();
      
      // If no workspaces exist, create a default one
      if (fetchedWorkspaces.length === 0) {
        const createResponse = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "default-user", // Temporarily hardcoded, will be removed when auth is added
            name: "My Workspace",
            description: "Default workspace",
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to create default workspace");
        }
        
        const newWorkspace = await createResponse.json();
        fetchedWorkspaces = [newWorkspace];
      }
      
      setWorkspaces(fetchedWorkspaces);
      
      // Check localStorage for saved workspace preference
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      const savedWorkspace = fetchedWorkspaces.find((ws) => ws.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace);
      } else {
        // Default to first workspace
        setCurrentWorkspace(fetchedWorkspaces[0]);
        localStorage.setItem("currentWorkspaceId", fetchedWorkspaces[0].id);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Failed to load workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Save workspace preference when it changes
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem("currentWorkspaceId", currentWorkspace.id);
    }
  }, [currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        setWorkspaces,
        isLoading,
        error,
        refetch: loadWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
