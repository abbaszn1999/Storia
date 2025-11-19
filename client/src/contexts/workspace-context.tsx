import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Workspace } from "@shared/schema";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspaces on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        // TODO: Replace hardcoded userId with auth when implemented
        const userId = "default-user";
        
        // Fetch workspaces from API
        const response = await fetch(`/api/workspaces?userId=${userId}`);
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
              userId,
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
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

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
