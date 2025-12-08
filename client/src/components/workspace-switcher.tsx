import { Check, ChevronsUpDown, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/contexts/workspace-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function WorkspaceSwitcher() {
  const { 
    currentWorkspace, 
    workspaces, 
    setCurrentWorkspace, 
    createWorkspace, 
    deleteWorkspace,
    isCreating,
    isDeleting 
  } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const { toast } = useToast();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: "Error",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const workspace = await createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined,
      });
      setCurrentWorkspace(workspace);
      setCreateDialogOpen(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      toast({
        title: "Workspace created",
        description: `"${workspace.name}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to create workspace",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      await deleteWorkspace(workspaceToDelete);
      setDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
      toast({
        title: "Workspace deleted",
        description: "The workspace has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete workspace",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceToDelete(workspaceId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-2 h-auto py-2"
            data-testid="button-workspace-switcher"
          >
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="text-xs font-medium truncate max-w-[160px]">
                {currentWorkspace?.name || "Select workspace"}
              </span>
              {currentWorkspace?.description && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                  {currentWorkspace.description}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-2" align="start">
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center group"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 h-auto py-2 flex-1"
                  onClick={() => {
                    setCurrentWorkspace(workspace);
                    setOpen(false);
                  }}
                  data-testid={`button-workspace-${workspace.id}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        currentWorkspace?.id === workspace.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                      <span className="text-sm font-medium truncate max-w-full">
                        {workspace.name}
                      </span>
                      {workspace.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-full">
                          {workspace.description}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
                {workspaces.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => openDeleteDialog(workspace.id, e)}
                    data-testid={`button-delete-workspace-${workspace.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start px-2"
                onClick={() => {
                  setOpen(false);
                  setCreateDialogOpen(true);
                }}
                data-testid="button-create-workspace"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                data-testid="input-workspace-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workspace-description">Description (optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="A brief description of this workspace..."
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="input-workspace-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create-workspace"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={isCreating}
              data-testid="button-confirm-create-workspace"
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone
              and will delete all projects within this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-workspace">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              data-testid="button-confirm-delete-workspace"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
