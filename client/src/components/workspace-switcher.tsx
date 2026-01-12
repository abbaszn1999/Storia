import { Check, ChevronDown, Plus, Settings, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
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
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const { toast } = useToast();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split("@")[0] || "User";
  
  // Get first letter of display name for avatar
  const firstLetter = displayName.charAt(0).toUpperCase();

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
            className={cn(
              "w-full justify-between px-3 h-auto py-2.5",
              "hover:bg-transparent active:bg-transparent"
            )}
            data-testid="button-workspace-switcher"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar with first letter */}
              <div className="flex-shrink-0 h-9 w-9 rounded-md bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {firstLetter}
                </span>
              </div>
              <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                <span className={cn(
                  "text-sm font-semibold truncate max-w-[140px]",
                  "text-sidebar-foreground"
                )}>
                  {displayName.toLowerCase()}
                </span>
                <span className={cn(
                  "text-xs truncate max-w-[140px]",
                  "text-sidebar-foreground/60"
                )}>
                  {currentWorkspace?.name || "Your first workspace"}
                </span>
              </div>
            </div>
            <ChevronDown className={cn(
              "ml-2 h-4 w-4 shrink-0 text-sidebar-foreground/40",
              "transition-transform duration-200 ease-out",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-2",
            "border-0 shadow-xl",
            "bg-background/95 backdrop-blur-xl",
            "rounded-lg"
          )} 
          align="start"
          side="top"
          sideOffset={8}
        >
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center group rounded-md hover:bg-accent/50 transition-colors"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 h-auto py-2.5 flex-1 hover:bg-transparent"
                  onClick={() => {
                    setCurrentWorkspace(workspace);
                    setOpen(false);
                  }}
                  data-testid={`button-workspace-${workspace.id}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary",
                        currentWorkspace?.id === workspace.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
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
                <div className="flex items-center gap-1 shrink-0 pr-1">
                  <Link href="/workspace/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-lg",
                        "hover:bg-primary/10",
                        "text-muted-foreground hover:text-primary",
                        "transition-all duration-300 ease-out"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                      }}
                      data-testid={`button-workspace-settings-${workspace.id}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  {workspaces.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => openDeleteDialog(workspace.id, e)}
                      data-testid={`button-delete-workspace-${workspace.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="border-t border-border/50 pt-2 mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start px-2 h-auto py-2.5 rounded-md hover:bg-accent/50"
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
        <DialogContent className={cn(
          "sm:max-w-[425px]",
          "bg-popover backdrop-blur-xl",
          "border-input"
        )}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Workspace</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new workspace to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name" className="text-foreground">Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                data-testid="input-workspace-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workspace-description" className="text-foreground">Description (optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="A brief description of this workspace..."
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                className={cn(
                  "resize-none",
                  "bg-background border-input text-foreground placeholder:text-muted-foreground"
                )}
                rows={3}
                data-testid="input-workspace-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-input"
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
