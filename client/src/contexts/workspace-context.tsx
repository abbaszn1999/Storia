import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Workspace } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createWorkspace: (data: { name: string; description?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: { name?: string; description?: string }) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  isCreating: boolean;
  isDeleting: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading, error, refetch } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/workspaces", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      const response = await apiRequest("PATCH", `/api/workspaces/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
    },
  });

  const setCurrentWorkspace = (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem("currentWorkspaceId", workspace.id);
    } else {
      localStorage.removeItem("currentWorkspaceId");
    }
  };

  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      const savedWorkspace = workspaces.find((ws) => ws.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        setCurrentWorkspaceState(savedWorkspace);
      } else {
        setCurrentWorkspaceState(workspaces[0]);
        localStorage.setItem("currentWorkspaceId", workspaces[0].id);
      }
    }
  }, [workspaces, currentWorkspace]);

  useEffect(() => {
    if (currentWorkspace && workspaces.length > 0) {
      const updated = workspaces.find((ws) => ws.id === currentWorkspace.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentWorkspace)) {
        setCurrentWorkspaceState(updated);
      }
    }
  }, [workspaces, currentWorkspace]);

  const createWorkspace = async (data: { name: string; description?: string }) => {
    return createMutation.mutateAsync(data);
  };

  const updateWorkspace = async (id: string, data: { name?: string; description?: string }) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const deleteWorkspace = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    if (currentWorkspace?.id === id) {
      const remaining = workspaces.filter((ws) => ws.id !== id);
      if (remaining.length > 0) {
        setCurrentWorkspace(remaining[0]);
      }
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        isLoading,
        error: error as Error | null,
        refetch,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
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
