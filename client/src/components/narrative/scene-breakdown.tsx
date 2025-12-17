import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit, Trash2, Plus, Copy, ChevronUp, ChevronDown, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@/types/storyboard";
import { SceneDialog } from "./scene-dialog";
import { ShotDialog } from "./shot-dialog";
import { ContinuityProposal } from "./continuity-proposal";
import { ShotContinuityArrows } from "./shot-continuity-arrows";
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
import { Textarea } from "@/components/ui/textarea";

interface SceneBreakdownProps {
  videoId: string;
  script: string;
  scriptModel?: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  isLogoMode?: boolean;
  isCommerceMode?: boolean;
  onScenesGenerated?: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onScenesChange?: (scenes: Scene[]) => void;
  onShotsChange?: (shots: { [sceneId: string]: Shot[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityLockedChange?: (locked: boolean) => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ 
  videoId, 
  script, 
  scriptModel = "gpt-4o", 
  narrativeMode,
  scenes, 
  shots, 
  shotVersions, 
  continuityLocked = false,
  continuityGroups: propsGroups = {},
  isLogoMode = false,
  isCommerceMode = false,
  onScenesGenerated, 
  onScenesChange,
  onShotsChange,
  onContinuityLocked,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onNext 
}: SceneBreakdownProps) {
  const { toast } = useToast();
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | undefined>();
  const [editingShot, setEditingShot] = useState<Shot | undefined>();
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);
  const [synopsis, setSynopsis] = useState<string>(script ? script.substring(0, 200) : "");
  const [isGeneratingContinuity, setIsGeneratingContinuity] = useState(false);
  const [localContinuityLocked, setLocalContinuityLocked] = useState(continuityLocked);
  
  // Refs for shot elements to measure their positions (per scene)
  const shotRefsMap = useRef<{ [sceneId: string]: React.RefObject<(HTMLDivElement | null)[]> }>({});
  
  // Separate state for approved vs. proposed vs. declined groups
  // Approved groups have status="approved" and persist across regenerations
  // Proposed groups have status="proposed" and can be edited/approved/declined
  // Declined groups have status="declined" and are kept for history
  const [localApprovedGroups, setLocalApprovedGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  const [localProposalDraft, setLocalProposalDraft] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  const [localDeclinedGroups, setLocalDeclinedGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  
  // Initialize from propsGroups by separating approved vs proposed vs declined
  useEffect(() => {
    const approved: { [sceneId: string]: ContinuityGroup[] } = {};
    const proposed: { [sceneId: string]: ContinuityGroup[] } = {};
    const declined: { [sceneId: string]: ContinuityGroup[] } = {};
    
    Object.entries(propsGroups).forEach(([sceneId, groups]) => {
      groups.forEach(group => {
        if (group.status === "approved") {
          if (!approved[sceneId]) approved[sceneId] = [];
          approved[sceneId].push(group);
        } else if (group.status === "proposed") {
          if (!proposed[sceneId]) proposed[sceneId] = [];
          proposed[sceneId].push(group);
        } else if (group.status === "declined") {
          if (!declined[sceneId]) declined[sceneId] = [];
          declined[sceneId].push(group);
        }
      });
    });
    
    setLocalApprovedGroups(approved);
    setLocalProposalDraft(proposed);
    setLocalDeclinedGroups(declined);
  }, []); // Only run once on mount
  
  // If parent provides callback, use props as source of truth; otherwise use local state
  const hasParentCallback = Boolean(onContinuityGroupsChange);
  
  // Merge approved, proposed, and declined groups for display
  const mergeAllGroups = (
    approved: { [sceneId: string]: ContinuityGroup[] }, 
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    const merged: { [sceneId: string]: ContinuityGroup[] } = {};
    
    // Add all approved groups
    Object.entries(approved).forEach(([sceneId, groups]) => {
      merged[sceneId] = [...groups];
    });
    
    // Add all proposed groups
    Object.entries(proposed).forEach(([sceneId, groups]) => {
      if (!merged[sceneId]) merged[sceneId] = [];
      merged[sceneId].push(...groups);
    });
    
    // Add all declined groups
    Object.entries(declined).forEach(([sceneId, groups]) => {
      if (!merged[sceneId]) merged[sceneId] = [];
      merged[sceneId].push(...groups);
    });
    
    return merged;
  };
  
  const approvedGroups = hasParentCallback 
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId, 
          groups.filter(g => g.status === "approved")
        ]).filter(([_, groups]) => groups.length > 0)
      )
    : localApprovedGroups;
    
  const proposalDraft = hasParentCallback
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId,
          groups.filter(g => g.status === "proposed")
        ]).filter(([_, groups]) => groups.length > 0)
      )
    : localProposalDraft;
  
  const declinedGroups = hasParentCallback
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId,
          groups.filter(g => g.status === "declined")
        ]).filter(([_, groups]) => groups.length > 0)
      )
    : localDeclinedGroups;
  
  const continuityGroups = mergeAllGroups(approvedGroups, proposalDraft, declinedGroups);
  
  // Update all three maps and notify parent
  const updateAllGroupMaps = (
    approved: { [sceneId: string]: ContinuityGroup[] },
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    if (hasParentCallback) {
      const merged = mergeAllGroups(approved, proposed, declined);
      onContinuityGroupsChange!(merged);
    } else {
      setLocalApprovedGroups(approved);
      setLocalProposalDraft(proposed);
      setLocalDeclinedGroups(declined);
    }
  };

  // Sync local lock state with prop when it changes
  useEffect(() => {
    setLocalContinuityLocked(continuityLocked);
  }, [continuityLocked]);

  const handleGenerateContinuityProposal = async () => {
    setIsGeneratingContinuity(true);
    try {
      // TODO: Call Agent 3.4 (Continuity Producer) to generate proposal for ALL scenes
      // For now, create dummy proposals for each scene with enough shots
      const newGroups: { [sceneId: string]: ContinuityGroup[] } = {};
      
      scenes.forEach((scene) => {
        const sceneShots = shots[scene.id] || [];
        if (sceneShots.length >= 2) {
          const sceneGroups: ContinuityGroup[] = [];
          let groupNumber = 1;
          let currentIndex = 0;
          
          // Create varied-length groups to demonstrate the arrow visualization
          // Mix of 2-shot, 3-shot, 4-shot, and 5-shot sequences
          while (currentIndex < sceneShots.length - 1) {
            // Determine group size based on remaining shots and variation
            const remainingShots = sceneShots.length - currentIndex;
            let groupSize: number;
            
            if (remainingShots >= 5 && Math.random() > 0.6) {
              groupSize = 5; // 40% chance for 5-shot sequence
            } else if (remainingShots >= 4 && Math.random() > 0.5) {
              groupSize = 4; // 50% chance for 4-shot sequence
            } else if (remainingShots >= 3 && Math.random() > 0.4) {
              groupSize = 3; // 60% chance for 3-shot sequence
            } else {
              groupSize = Math.min(2, remainingShots); // Default to 2-shot
            }
            
            // Create group with the determined size
            const groupShotIds = sceneShots
              .slice(currentIndex, currentIndex + groupSize)
              .map(s => s.id);
            
            const transitionTypes = ["flow", "zoom", "pan", "cut"] as const;
            const descriptions = [
              "AI detected continuous camera movement between these shots",
              "Seamless transition with consistent lighting and perspective",
              "Connected sequence with matching visual elements",
              "Smooth flow maintaining spatial continuity"
            ];
            
            const dummyGroup: ContinuityGroup = {
              id: `group-${scene.id}-${groupNumber}-${Date.now()}`,
              sceneId: scene.id,
              groupNumber: groupNumber,
              shotIds: groupShotIds,
              description: descriptions[Math.floor(Math.random() * descriptions.length)],
              transitionType: transitionTypes[Math.floor(Math.random() * transitionTypes.length)],
              status: "proposed",
              editedBy: null,
              editedAt: null,
              approvedAt: null,
              createdAt: new Date(),
            };
            
            sceneGroups.push(dummyGroup);
            currentIndex += groupSize;
            groupNumber++;
          }
          
          if (sceneGroups.length > 0) {
            newGroups[scene.id] = sceneGroups;
          }
        }
      });

      if (Object.keys(newGroups).length === 0) {
        toast({
          title: "Not enough shots",
          description: "At least one scene needs 2 or more shots to create continuity connections.",
          variant: "destructive",
        });
        return;
      }

      // Set new proposals (preserves existing approved and declined groups)
      updateAllGroupMaps(approvedGroups, newGroups, declinedGroups);

      toast({
        title: "Continuity Proposal Generated",
        description: `Generated proposals for ${Object.keys(newGroups).length} scene${Object.keys(newGroups).length !== 1 ? 's' : ''}. Review and approve to proceed.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate continuity proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContinuity(false);
    }
  };

  // Granular callbacks for per-group actions
  const handleGroupApprove = (sceneId: string, groupId: string) => {
    // Find the group in proposals
    const sceneProposals = proposalDraft[sceneId] || [];
    const groupToApprove = sceneProposals.find((g: ContinuityGroup) => g.id === groupId);
    
    if (!groupToApprove) {
      toast({
        title: "Group not found",
        description: "Could not find the group to approve.",
        variant: "destructive",
      });
      return;
    }

    // Mark as approved and move to approved map
    const approvedGroup: ContinuityGroup = {
      ...groupToApprove,
      status: "approved",
      approvedAt: new Date(),
    };

    // Deep clone approved groups map
    const newApproved: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(approvedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newApproved[id] = [...groups]; // Clone array
    });
    if (!newApproved[sceneId]) newApproved[sceneId] = [];
    newApproved[sceneId] = [...newApproved[sceneId], approvedGroup];

    // Deep clone proposed groups map
    const newProposed: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(proposalDraft) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      if (id === sceneId) {
        newProposed[id] = groups.filter((g: ContinuityGroup) => g.id !== groupId);
      } else {
        newProposed[id] = [...groups]; // Clone array
      }
    });
    if (newProposed[sceneId]?.length === 0) delete newProposed[sceneId];

    // Deep clone declined groups map
    const newDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(declinedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newDeclined[id] = [...groups]; // Clone array
    });

    updateAllGroupMaps(newApproved, newProposed, newDeclined);

    toast({
      title: "Group Approved",
      description: "Continuity group approved successfully.",
    });
  };

  const handleGroupDecline = (sceneId: string, groupId: string) => {
    // Find the group in proposals
    const sceneProposals = proposalDraft[sceneId] || [];
    const groupToDecline = sceneProposals.find((g: ContinuityGroup) => g.id === groupId);
    
    if (!groupToDecline) {
      toast({
        title: "Group not found",
        description: "Could not find the group to decline.",
        variant: "destructive",
      });
      return;
    }

    // Mark as declined and move to declined map
    const declinedGroup: ContinuityGroup = {
      ...groupToDecline,
      status: "declined",
    };

    // Deep clone declined groups map
    const newDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(declinedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newDeclined[id] = [...groups]; // Clone array
    });
    if (!newDeclined[sceneId]) newDeclined[sceneId] = [];
    newDeclined[sceneId] = [...newDeclined[sceneId], declinedGroup];

    // Deep clone proposed groups map
    const newProposed: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(proposalDraft) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      if (id === sceneId) {
        newProposed[id] = groups.filter((g: ContinuityGroup) => g.id !== groupId);
      } else {
        newProposed[id] = [...groups]; // Clone array
      }
    });
    if (newProposed[sceneId]?.length === 0) delete newProposed[sceneId];

    // Deep clone approved groups map
    const newApproved: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(approvedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newApproved[id] = [...groups]; // Clone array
    });

    updateAllGroupMaps(newApproved, newProposed, newDeclined);

    toast({
      title: "Group Declined",
      description: "Continuity group declined successfully.",
    });
  };

  const handleGroupEdit = (sceneId: string, updatedGroup: ContinuityGroup) => {
    // Update the group in proposals (status stays "proposed")
    const sceneProposals = proposalDraft[sceneId] || [];
    const groupIndex = sceneProposals.findIndex((g: ContinuityGroup) => g.id === updatedGroup.id);
    
    if (groupIndex === -1) {
      toast({
        title: "Group not found",
        description: "Could not find the group to edit.",
        variant: "destructive",
      });
      return;
    }

    const editedGroup: ContinuityGroup = {
      ...updatedGroup,
      status: "proposed", // Keep as proposed
      editedBy: "user", // TODO: Use actual user ID when auth is implemented
      editedAt: new Date(),
    };

    // Deep clone proposed groups map
    const newProposed: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(proposalDraft) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      if (id === sceneId) {
        const clonedGroups = [...groups];
        clonedGroups[groupIndex] = editedGroup;
        newProposed[id] = clonedGroups;
      } else {
        newProposed[id] = [...groups]; // Clone array
      }
    });

    // Deep clone approved groups map
    const newApproved: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(approvedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newApproved[id] = [...groups]; // Clone array
    });

    // Deep clone declined groups map
    const newDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(declinedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newDeclined[id] = [...groups]; // Clone array
    });

    updateAllGroupMaps(newApproved, newProposed, newDeclined);

    toast({
      title: "Group Updated",
      description: "Continuity group updated successfully.",
    });
  };

  // Handle approving individual shot-to-shot connections
  const handleApproveConnection = (sceneId: string, shotId1: string, shotId2: string) => {
    // Find the group containing this connection in proposals
    const sceneProposals = proposalDraft[sceneId] || [];
    const groupWithConnection = sceneProposals.find((g: ContinuityGroup) => {
      const shotIds = g.shotIds as string[];
      const idx1 = shotIds.indexOf(shotId1);
      const idx2 = shotIds.indexOf(shotId2);
      return idx1 >= 0 && idx2 === idx1 + 1;
    });
    
    if (!groupWithConnection) return;
    
    const shotIds = groupWithConnection.shotIds as string[];
    const idx1 = shotIds.indexOf(shotId1);
    
    // If this is the only connection in the group, approve the entire group
    if (shotIds.length === 2) {
      handleGroupApprove(sceneId, groupWithConnection.id);
      return;
    }
    
    // Otherwise, split the group:
    // 1. Create an approved group with just this connection [shotId1, shotId2]
    // 2. Keep remaining shots as separate proposed groups
    
    const approvedGroup: ContinuityGroup = {
      ...groupWithConnection,
      id: crypto.randomUUID(),
      shotIds: [shotId1, shotId2],
      status: "approved",
      approvedAt: new Date(),
    };
    
    // Create new proposed groups from the remaining parts
    const newProposedGroups: ContinuityGroup[] = [];
    
    // Before the approved connection
    if (idx1 > 0) {
      const beforeShots = shotIds.slice(0, idx1 + 1); // Include shotId1
      if (beforeShots.length >= 2) {
        newProposedGroups.push({
          ...groupWithConnection,
          id: crypto.randomUUID(),
          shotIds: beforeShots,
          status: "proposed",
        });
      }
    }
    
    // After the approved connection
    if (idx1 + 2 < shotIds.length) {
      const afterShots = shotIds.slice(idx1 + 1); // Start from shotId2
      if (afterShots.length >= 2) {
        newProposedGroups.push({
          ...groupWithConnection,
          id: crypto.randomUUID(),
          shotIds: afterShots,
          status: "proposed",
        });
      }
    }
    
    // Update all group maps
    const newApproved: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(approvedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newApproved[id] = [...groups];
    });
    if (!newApproved[sceneId]) newApproved[sceneId] = [];
    newApproved[sceneId] = [...newApproved[sceneId], approvedGroup];
    
    const newProposed: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(proposalDraft) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      if (id === sceneId) {
        // Remove old group and add new split groups
        newProposed[id] = groups.filter((g: ContinuityGroup) => g.id !== groupWithConnection.id);
        newProposed[id].push(...newProposedGroups);
      } else {
        newProposed[id] = [...groups];
      }
    });
    if (newProposed[sceneId]?.length === 0) delete newProposed[sceneId];
    
    const newDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(declinedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newDeclined[id] = [...groups];
    });
    
    updateAllGroupMaps(newApproved, newProposed, newDeclined);
    
    toast({
      title: "Connection Approved",
      description: "Shot connection approved successfully.",
    });
  };

  // Handle declining individual shot-to-shot connections
  const handleDeclineConnection = (sceneId: string, shotId1: string, shotId2: string) => {
    // Find the group containing this connection in proposals
    const sceneProposals = proposalDraft[sceneId] || [];
    const groupWithConnection = sceneProposals.find((g: ContinuityGroup) => {
      const shotIds = g.shotIds as string[];
      const idx1 = shotIds.indexOf(shotId1);
      const idx2 = shotIds.indexOf(shotId2);
      return idx1 >= 0 && idx2 === idx1 + 1;
    });
    
    if (!groupWithConnection) return;
    
    const shotIds = groupWithConnection.shotIds as string[];
    const idx1 = shotIds.indexOf(shotId1);
    
    // If this is the only connection in the group, decline the entire group
    if (shotIds.length === 2) {
      handleGroupDecline(sceneId, groupWithConnection.id);
      return;
    }
    
    // Otherwise, split the group and remove this connection:
    // Keep shots before and after as separate proposed groups
    
    const newProposedGroups: ContinuityGroup[] = [];
    
    // Before the declined connection
    if (idx1 > 0) {
      const beforeShots = shotIds.slice(0, idx1 + 1); // Include shotId1
      if (beforeShots.length >= 2) {
        newProposedGroups.push({
          ...groupWithConnection,
          id: crypto.randomUUID(),
          shotIds: beforeShots,
          status: "proposed",
        });
      }
    }
    
    // After the declined connection
    if (idx1 + 2 < shotIds.length) {
      const afterShots = shotIds.slice(idx1 + 1); // Start from shotId2
      if (afterShots.length >= 2) {
        newProposedGroups.push({
          ...groupWithConnection,
          id: crypto.randomUUID(),
          shotIds: afterShots,
          status: "proposed",
        });
      }
    }
    
    // Update all group maps
    const newProposed: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(proposalDraft) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      if (id === sceneId) {
        // Remove old group and add new split groups
        newProposed[id] = groups.filter((g: ContinuityGroup) => g.id !== groupWithConnection.id);
        newProposed[id].push(...newProposedGroups);
      } else {
        newProposed[id] = [...groups];
      }
    });
    if (newProposed[sceneId]?.length === 0) delete newProposed[sceneId];
    
    const newApproved: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(approvedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newApproved[id] = [...groups];
    });
    
    const newDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
    (Object.entries(declinedGroups) as [string, ContinuityGroup[]][]).forEach(([id, groups]) => {
      newDeclined[id] = [...groups];
    });
    
    updateAllGroupMaps(newApproved, newProposed, newDeclined);
    
    toast({
      title: "Connection Declined",
      description: "Shot connection declined successfully.",
    });
  };

  const handleLock = () => {
    // Lock the continuity (at least one group must be approved)
    const approvedGroupsArray = Object.values(approvedGroups) as ContinuityGroup[][];
    const hasApprovedGroups = approvedGroupsArray.some((groups) => groups.length > 0);
    
    if (!hasApprovedGroups) {
      toast({
        title: "No Approved Groups",
        description: "Please approve at least one continuity group before locking.",
        variant: "destructive",
      });
      return;
    }

    // Set local lock state immediately for UI responsiveness
    setLocalContinuityLocked(true);
    
    // Update parent state to lock continuity
    if (onContinuityLocked) {
      onContinuityLocked();
    }

    toast({
      title: "Continuity Locked",
      description: "Shot connections are now final. Proceeding to storyboard generation.",
    });
  };

  // TEMPORARY: Load dummy data for testing UI
  useEffect(() => {
    // Don't load if we already have data from parent
    if (scenes.length > 0 || Object.keys(shots).length > 0) return;
    if (propsGroups && Object.keys(propsGroups).length > 0) return;
    
    const dummyScenes: Scene[] = [
        {
          id: "scene-1",
          videoId,
          sceneNumber: 1,
          title: "The Discovery",
          description: "Sarah stumbles upon an ancient map in her grandmother's attic, revealing the location of a hidden temple deep in the Amazon jungle.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: null,
          weather: null,
          createdAt: new Date(),
        },
        {
          id: "scene-2",
          videoId,
          sceneNumber: 2,
          title: "Journey Begins",
          description: "Sarah packs her gear and boards a small plane to Brazil. As they fly over the vast rainforest, she studies the map with growing excitement.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: null,
          weather: null,
          createdAt: new Date(),
        },
        {
          id: "scene-3",
          videoId,
          sceneNumber: 3,
          title: "Into the Jungle",
          description: "Sarah and her guide hack through dense vegetation. Strange sounds echo through the trees as they navigate treacherous terrain towards their destination.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: null,
          weather: null,
          createdAt: new Date(),
        },
        {
          id: "scene-4",
          videoId,
          sceneNumber: 4,
          title: "The Temple Revealed",
          description: "Pushing through a wall of vines, Sarah gasps as an magnificent ancient temple emerges from the jungle, covered in mysterious symbols glowing faintly in the twilight.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: null,
          weather: null,
          createdAt: new Date(),
        },
      ];

      const dummyShots: { [sceneId: string]: Shot[] } = {
        "scene-1": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 1,
            shotType: "Close-Up",
            description: "Close-up of dusty boxes and old photographs in dim attic lighting",
            duration: 8,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah's hand reaches into an ornate wooden box, pulling out an aged, yellowed map",
            duration: 12,
            cameraMovement: "push in",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 3,
            shotType: "Medium Close-Up",
            description: "Sarah's eyes widen as she unfolds the map, candlelight illuminating ancient markings",
            duration: 15,
            cameraMovement: "dolly in",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 4,
            shotType: "Extreme Close-Up",
            description: "Extreme close-up of the map showing detailed illustrations of a temple hidden in jungle",
            duration: 10,
            cameraMovement: "pan right",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-2": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-2",
            shotNumber: 1,
            shotType: "Wide Shot",
            description: "Wide shot of small propeller plane on tarmac at sunrise",
            duration: 10,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-2",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah climbs into the plane with her backpack and equipment",
            duration: 8,
            cameraMovement: "tracking",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-2",
            shotNumber: 3,
            shotType: "Aerial",
            description: "Aerial view from plane window showing endless green canopy of Amazon rainforest",
            duration: 12,
            cameraMovement: "slow zoom",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-2",
            shotNumber: 4,
            shotType: "Close-Up",
            description: "Interior shot of Sarah studying the map intensely, finger tracing route",
            duration: 15,
            cameraMovement: "push in",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-3": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 1,
            shotType: "Medium Shot",
            description: "Low angle shot of machete cutting through thick jungle vines",
            duration: 8,
            cameraMovement: "handheld",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah and guide navigate through dense undergrowth, sweat on their faces",
            duration: 14,
            cameraMovement: "tracking",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 3,
            shotType: "POV",
            description: "POV shot looking up through canopy as mysterious bird calls echo",
            duration: 10,
            cameraMovement: "tilt up",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 4,
            shotType: "Close-Up",
            description: "Close-up of Sarah checking compass against map, determination in her expression",
            duration: 13,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-4": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 1,
            shotType: "Medium Shot",
            description: "Sarah's hand pushes aside wall of hanging vines in slow motion",
            duration: 10,
            cameraMovement: "push forward",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 2,
            shotType: "Wide Shot",
            description: "Reveal shot of massive temple structure emerging from jungle vegetation",
            duration: 18,
            cameraMovement: "crane up",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 3,
            shotType: "Medium Close-Up",
            description: "Sarah's face in golden hour lighting, expression of wonder and amazement",
            duration: 8,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 4,
            shotType: "Medium Shot",
            description: "Dolly shot along temple wall showing intricate carvings and glowing symbols",
            duration: 12,
            cameraMovement: "dolly right",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 5,
            shotType: "Aerial",
            description: "Wide establishing shot of temple against jungle backdrop as sun sets",
            duration: 12,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            transition: "cut",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Create dummy shot versions with placeholder images
      const dummyShotVersions: { [shotId: string]: ShotVersion[] } = {};
      Object.values(dummyShots).flat().forEach((shot, index) => {
        const versionId = `version-${shot.id}-1`;
        const colors = [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop', // Mountain landscape
          'https://images.unsplash.com/photo-1506709551723-4c3c5c8bbb4b?w=800&h=450&fit=crop', // Forest
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=450&fit=crop', // Nature
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=450&fit=crop', // Forest path
        ];
        const imageUrl = colors[index % colors.length];

        dummyShotVersions[shot.id] = [
          {
            id: versionId,
            shotId: shot.id,
            versionNumber: 1,
            imagePrompt: shot.description || '',
            imageUrl,
            startFramePrompt: null,
            startFrameUrl: null,
            endFramePrompt: null,
            endFrameUrl: null,
            videoPrompt: null,
            videoUrl: null,
            videoDuration: null,
            status: "completed",
            needsRerender: false,
            createdAt: new Date(),
          },
        ];
        
        // Update shot to reference this version
        shot.currentVersionId = versionId;
      });

    setSynopsis("An adventurous explorer discovers a mysterious map leading to an ancient temple deep in the Amazon rainforest. Her journey takes her from a dusty attic to the heart of the jungle, where she faces both natural obstacles and the lure of forgotten civilizations. As she pushes through the dense vegetation, the temple's secrets begin to reveal themselves.");
    onScenesGenerated?.(dummyScenes, dummyShots, dummyShotVersions);
    onScenesChange?.(dummyScenes);
    onShotsChange?.(dummyShots);
  }, []);

  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex < 0) return;
    
    const targetIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const currentScene = scenes[sceneIndex];
    const targetScene = scenes[targetIndex];

    const updatedScenes = [...scenes];
    updatedScenes[sceneIndex] = { ...currentScene, sceneNumber: targetScene.sceneNumber };
    updatedScenes[targetIndex] = { ...targetScene, sceneNumber: currentScene.sceneNumber };
    updatedScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);

    onScenesGenerated?.(updatedScenes, shots);
    onScenesChange?.(updatedScenes);
    toast({ title: "Scene order updated" });
  };

  const refreshSceneData = (updatedScene: Scene, updatedShot?: Shot) => {
    const updatedScenes = [...scenes];
    const sceneIndex = updatedScenes.findIndex(s => s.id === updatedScene.id);
    
    if (sceneIndex >= 0) {
      updatedScenes[sceneIndex] = updatedScene;
    } else {
      updatedScenes.push(updatedScene);
      updatedScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
    }

    const updatedShots = { ...shots };
    if (updatedShot) {
      const shotList = updatedShots[updatedShot.sceneId] || [];
      const shotIndex = shotList.findIndex(s => s.id === updatedShot.id);
      
      if (shotIndex >= 0) {
        shotList[shotIndex] = updatedShot;
      } else {
        shotList.push(updatedShot);
        shotList.sort((a, b) => a.shotNumber - b.shotNumber);
      }
      updatedShots[updatedShot.sceneId] = shotList;
    }

    onScenesGenerated?.(updatedScenes, updatedShots);
    onScenesChange?.(updatedScenes);
    onShotsChange?.(updatedShots);
  };

  const removeSceneData = (sceneId: string) => {
    const updatedScenes = scenes.filter(s => s.id !== sceneId);
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onScenesGenerated?.(updatedScenes, updatedShots);
    onScenesChange?.(updatedScenes);
    onShotsChange?.(updatedShots);
  };

  const removeShotData = (shotId: string, sceneId: string) => {
    const updatedShots = { ...shots };
    if (updatedShots[sceneId]) {
      updatedShots[sceneId] = updatedShots[sceneId].filter(s => s.id !== shotId);
    }
    onScenesGenerated?.(scenes, updatedShots);
    onShotsChange?.(updatedShots);
  };

  const handleGenerateBreakdown = async () => {
    try {
      const response = await fetch('/api/narrative/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          script,
          model: scriptModel,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate breakdown');
      const data = await response.json() as { scenes: Scene[]; shots: { [sceneId: string]: Shot[] } };
      
      onScenesGenerated?.(data.scenes, data.shots);
      onScenesChange?.(data.scenes);
      onShotsChange?.(data.shots);
      setSynopsis(script.substring(0, 200));
      toast({
        title: "Breakdown Complete",
        description: `Generated ${data.scenes.length} scenes with shots.`,
      });
    } catch (error) {
      toast({
        title: "Breakdown Failed",
        description: "Failed to analyze script. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);

  const handleSceneSubmit = async (data: any): Promise<void> => {
    if (editingScene) {
      // Update existing scene
      const updatedScene: Scene = {
        ...editingScene,
        ...data,
        updatedAt: new Date(),
      };
      refreshSceneData(updatedScene);
      toast({ title: "Scene updated successfully" });
    } else {
      // Create new scene
      const newScene: Scene = {
        id: crypto.randomUUID(),
        videoId,
        sceneNumber: scenes.length + 1,
        ...data,
        createdAt: new Date(),
      };
      refreshSceneData(newScene);
      toast({ title: "Scene created successfully" });
    }
    setSceneDialogOpen(false);
    setEditingScene(undefined);
  };

  const handleShotSubmit = async (data: any): Promise<void> => {
    if (editingShot) {
      // Update existing shot
      const updatedShot: Shot = {
        ...editingShot,
        ...data,
        updatedAt: new Date(),
      };
      const scene = scenes.find(s => s.id === updatedShot.sceneId);
      if (scene) refreshSceneData(scene, updatedShot);
      toast({ title: "Shot updated successfully" });
    } else {
      // Create new shot
      const sceneShots = shots[activeSceneId] || [];
      const newShot: Shot = {
        id: crypto.randomUUID(),
        sceneId: activeSceneId,
        shotNumber: sceneShots.length + 1,
        ...data,
        currentVersionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const scene = scenes.find(s => s.id === activeSceneId);
      if (scene) refreshSceneData(scene, newShot);
      toast({ title: "Shot created successfully" });
    }
    setShotDialogOpen(false);
    setEditingShot(undefined);
  };

  const handleDeleteScene = (id: string) => {
    removeSceneData(id);
    toast({ title: "Scene deleted successfully" });
    setDeleteSceneId(null);
  };

  const handleDeleteShot = (id: string) => {
    const shot = Object.values(shots).flat().find(s => s.id === id);
    if (shot) {
      removeShotData(shot.id, shot.sceneId);
      toast({ title: "Shot deleted successfully" });
    }
    setDeleteShotId(null);
  };

  const openAddSceneDialog = () => {
    setEditingScene(undefined);
    setSceneDialogOpen(true);
  };

  const openEditSceneDialog = (scene: Scene) => {
    setEditingScene(scene);
    setSceneDialogOpen(true);
  };

  const openAddShotDialog = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setEditingShot(undefined);
    setShotDialogOpen(true);
  };

  const openEditShotDialog = (shot: Shot, sceneId: string) => {
    setActiveSceneId(sceneId);
    setEditingShot(shot);
    setShotDialogOpen(true);
  };

  const duplicateScene = (scene: Scene) => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      videoId: scene.videoId,
      sceneNumber: scenes.length + 1,
      title: `${scene.title} (Copy)`,
      description: scene.description,
      duration: scene.duration,
      videoModel: scene.videoModel,
      imageModel: scene.imageModel,
      lighting: scene.lighting,
      weather: scene.weather,
      createdAt: new Date(),
    };
    refreshSceneData(newScene);
    toast({ title: "Scene duplicated successfully" });
  };

  const totalShots = Object.values(shots).flat().length;
  const totalDuration = scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);
  const hasBreakdown = scenes.length > 0;
  const accentClasses = "from-purple-500 to-pink-500";

  return (
    <div className="space-y-6">
      {!hasBreakdown ? (
        <div className="space-y-6">
          <div className="text-center py-16">
            <div className={cn("h-16 w-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br flex items-center justify-center", accentClasses)}>
              <Film className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Generate Scene Breakdown</h3>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              AI will analyze your script and break it down into scenes and shots for your storyboard.
            </p>
            <Button
              size="lg"
              onClick={async () => {
                setIsGeneratingBreakdown(true);
                await handleGenerateBreakdown();
                setIsGeneratingBreakdown(false);
              }}
              disabled={isGeneratingBreakdown}
              className={cn("bg-gradient-to-br text-white hover:opacity-90", accentClasses)}
              data-testid="button-generate-breakdown"
            >
              {isGeneratingBreakdown ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Scene Breakdown
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-white/40 mb-4">or</p>
            <Button
              variant="outline"
              onClick={openAddSceneDialog}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              data-testid="button-add-scene"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scene Manually
            </Button>
          </div>
        </div>
      ) : (
        <>
          {synopsis && (
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-2 text-white">Synopsis</h3>
                <Textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="text-sm resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  rows={3}
                  data-testid="input-synopsis"
                />
              </CardContent>
            </Card>
          )}

          {/* Continuity Proposal for Start-End Mode - Top of Page */}
          {narrativeMode === "start-end" && (
            <ContinuityProposal
              scenes={scenes}
              allShots={shots}
              proposedGroups={proposalDraft}
              approvedGroups={approvedGroups}
              declinedGroups={declinedGroups}
              onGroupApprove={handleGroupApprove}
              onGroupDecline={handleGroupDecline}
              onGroupEdit={handleGroupEdit}
              onLock={handleLock}
              onGenerateProposal={handleGenerateContinuityProposal}
              isGenerating={isGeneratingContinuity}
              isLocked={localContinuityLocked}
            />
          )}

          <div className="space-y-4">
            {scenes.map((scene, sceneIndex) => {
              const sceneShots = shots[scene.id] || [];
              
              // Initialize refs for this scene if not already done
              if (!shotRefsMap.current[scene.id]) {
                const newRef: React.RefObject<(HTMLDivElement | null)[]> = {
                  get current() {
                    return this._current || [];
                  },
                  set current(value) {
                    this._current = value;
                  },
                  _current: new Array(sceneShots.length).fill(null) as (HTMLDivElement | null)[],
                } as any;
                shotRefsMap.current[scene.id] = newRef;
              }
              const shotRefs = shotRefsMap.current[scene.id];
              
              return (
                <Card key={scene.id} className="bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30 transition-all" data-testid={`scene-${scene.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold", accentClasses)}>
                          {sceneIndex + 1}
                        </div>
                        <h3 className="font-semibold text-white">
                          {scene.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs bg-white/10 text-white/70 border-0" data-testid={`scene-duration-${scene.id}`}>
                          {scene.duration || 0}s
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateScene(scene)}
                          className="text-white/50 hover:text-white hover:bg-white/10"
                          data-testid={`button-copy-scene-${scene.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditSceneDialog(scene)}
                          className="text-white/50 hover:text-white hover:bg-white/10"
                          data-testid={`button-edit-scene-${scene.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={sceneIndex === 0}
                          onClick={() => moveScene(scene.id, 'up')}
                          className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
                          data-testid={`button-move-up-scene-${scene.id}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={sceneIndex === scenes.length - 1}
                          onClick={() => moveScene(scene.id, 'down')}
                          className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
                          data-testid={`button-move-down-scene-${scene.id}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteSceneId(scene.id)}
                          className="text-white/50 hover:text-red-400 hover:bg-red-500/10"
                          data-testid={`button-delete-scene-${scene.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="relative space-y-2">
                      {/* Render continuity arrows for start-end mode */}
                      {narrativeMode === "start-end" && sceneShots.length > 0 && (
                        <ShotContinuityArrows
                          sceneId={scene.id}
                          sceneShots={sceneShots}
                          proposedGroups={proposalDraft[scene.id] || []}
                          approvedGroups={approvedGroups[scene.id] || []}
                          isLocked={localContinuityLocked}
                          onApproveConnection={(shotId1, shotId2) => handleApproveConnection(scene.id, shotId1, shotId2)}
                          onDeclineConnection={(shotId1, shotId2) => handleDeclineConnection(scene.id, shotId1, shotId2)}
                          shotRefs={shotRefs}
                        />
                      )}
                      
                      {sceneShots.map((shot, shotIndex) => (
                        <div
                          key={shot.id}
                          ref={(el) => {
                            if (shotRefs.current) {
                              shotRefs.current[shotIndex] = el;
                            }
                          }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/20 transition-all"
                          data-testid={`shot-${shot.id}`}
                        >
                          <div className={cn("h-2 w-2 rounded-full bg-gradient-to-br mt-2 shrink-0", accentClasses)}>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white mr-2">Shot {shotIndex + 1}</span>
                            <span className="text-sm text-white/70">{shot.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/50">
                              {shot.description?.length || 0}/200
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditShotDialog(shot, scene.id)}
                              className="text-white/50 hover:text-white hover:bg-white/10"
                              data-testid={`button-edit-shot-${shot.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteShotId(shot.id)}
                              className="text-white/50 hover:text-red-400 hover:bg-red-500/10"
                              data-testid={`button-delete-shot-${shot.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddShotDialog(scene.id)}
                        className="w-full mt-2 border border-dashed border-white/10 text-white/50 hover:border-purple-500/30 hover:text-white hover:bg-white/[0.02]"
                        data-testid={`button-add-shot-${scene.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              onClick={openAddSceneDialog}
              className="w-full border-dashed border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
              data-testid="button-add-scene"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scene
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <div className="text-sm text-white/50">
              The video is approximately{' '}
              <span className="text-white font-medium">
                {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
              </span>{' '}
              ({totalShots} shots)
            </div>
          </div>

          <SceneDialog
            open={sceneDialogOpen}
            onOpenChange={setSceneDialogOpen}
            scene={editingScene}
            videoId={videoId}
            sceneCount={scenes.length}
            onSubmit={handleSceneSubmit}
            isPending={false}
          />

          <ShotDialog
            open={shotDialogOpen}
            onOpenChange={setShotDialogOpen}
            shot={editingShot}
            sceneId={activeSceneId}
            shotCount={activeSceneId ? (shots[activeSceneId] || []).length : 0}
            onSubmit={handleShotSubmit}
            isPending={false}
          />

          <AlertDialog open={!!deleteSceneId} onOpenChange={(open) => !open && setDeleteSceneId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Scene</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this scene? This will also delete all shots in this scene. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-scene">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSceneId && handleDeleteScene(deleteSceneId)}
                  data-testid="button-confirm-delete-scene"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteShotId} onOpenChange={(open) => !open && setDeleteShotId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Shot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this shot? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-shot">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteShotId && handleDeleteShot(deleteShotId)}
                  data-testid="button-confirm-delete-shot"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
