import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/contexts/workspace-context";
import { useState } from "react";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  return (
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
      <PopoverContent className="w-[240px] p-2" align="start">
        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <Button
              key={workspace.id}
              variant="ghost"
              className="w-full justify-start px-2 h-auto py-2"
              onClick={() => {
                setCurrentWorkspace(workspace);
                setOpen(false);
              }}
              data-testid={`button-workspace-${workspace.id}`}
            >
              <div className="flex items-center gap-2 flex-1">
                <Check
                  className={`h-4 w-4 ${
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
          ))}
          <div className="border-t pt-2 mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2"
              onClick={() => {
                // TODO: Implement create workspace dialog
                console.log("Create new workspace");
                setOpen(false);
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
  );
}
