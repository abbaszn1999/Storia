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

  // Load workspaces on mount (mock for now, will integrate with API later)
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        // TODO: Replace with actual API call when auth is implemented
        // For now, create a default workspace
        const mockWorkspace: Workspace = {
          id: "default-workspace",
          userId: "default-user",
          name: "My Workspace",
          description: "Default workspace",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setWorkspaces([mockWorkspace]);
        
        // Check localStorage for saved workspace preference
        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
        if (savedWorkspaceId === mockWorkspace.id) {
          setCurrentWorkspace(mockWorkspace);
        } else {
          // Default to first workspace
          setCurrentWorkspace(mockWorkspace);
          localStorage.setItem("currentWorkspaceId", mockWorkspace.id);
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
