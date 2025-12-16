import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit, Trash2, Plus, Copy, ChevronUp, ChevronDown, FileText, Layers, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@shared/schema";
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
  scriptModel: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ 
  videoId, 
  script, 
  scriptModel, 
  narrativeMode,
  scenes, 
  shots, 
  shotVersions, 
  continuityLocked = false,
  continuityGroups: propsGroups = {},
  onScenesGenerated, 
  onContinuityLocked,
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
  
  // Always use local state for Flow phase UI (proposals, approvals, declines)
  // The parent only receives approved groups for the Composition phase
  const approvedGroups = localApprovedGroups;
  const proposalDraft = localProposalDraft;
  const declinedGroups = localDeclinedGroups;
  
  const continuityGroups = mergeAllGroups(approvedGroups, proposalDraft, declinedGroups);
  
  // Update all three maps and notify parent
  const updateAllGroupMaps = (
    approved: { [sceneId: string]: ContinuityGroup[] },
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    // Always update local state for all groups (needed for Flow phase UI)
    setLocalApprovedGroups(approved);
    setLocalProposalDraft(proposed);
    setLocalDeclinedGroups(declined);
    
    // Only pass approved groups to parent - Composition phase should only see approved connections
    if (hasParentCallback) {
      onContinuityGroupsChange!(approved);
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

  // TEMPORARY: Load dummy data for testing UI (Ambient mode)
  useEffect(() => {
    // Don't load if we already have data from parent
    if (scenes.length > 0 || Object.keys(shots).length > 0) return;
    if (propsGroups && Object.keys(propsGroups).length > 0) return;
    
    const dummyScenes: Scene[] = [
        {
          id: "scene-1",
          videoId,
          sceneNumber: 1,
          title: "Morning Mist",
          description: "Soft morning light filters through dense forest canopy. Mist rises gently from the forest floor as dewdrops glisten on leaves.",
          duration: 60,
          videoModel: null,
          imageModel: null,
          lighting: "Golden Hour",
          weather: "Misty",
          createdAt: new Date(),
        },
        {
          id: "scene-2",
          videoId,
          sceneNumber: 2,
          title: "Flowing Waters",
          description: "A peaceful stream winds through moss-covered rocks. Sunlight dances on the rippling water surface creating natural patterns.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: "Natural Daylight",
          weather: "Clear",
          createdAt: new Date(),
        },
        {
          id: "scene-3",
          videoId,
          sceneNumber: 3,
          title: "Forest Depths",
          description: "Deep within the ancient forest, shafts of light pierce through the canopy. Ferns sway gently in the breeze.",
          duration: 45,
          videoModel: null,
          imageModel: null,
          lighting: "Soft Light",
          weather: "Partly Cloudy",
          createdAt: new Date(),
        },
        {
          id: "scene-4",
          videoId,
          sceneNumber: 4,
          title: "Twilight Calm",
          description: "As evening approaches, the forest takes on warm golden tones. Birds settle into the trees as nature prepares for rest.",
          duration: 60,
          videoModel: null,
          imageModel: null,
          lighting: "Golden Hour",
          weather: "Clear",
          createdAt: new Date(),
        },
      ];

      const dummyShots: { [sceneId: string]: Shot[] } = {
        "scene-1": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 1,
            shotType: "Wide Shot",
            description: "Wide view of misty forest at dawn, soft golden light filtering through trees",
            duration: 20,
            cameraMovement: "slow zoom-in",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 2,
            shotType: "Close-Up",
            description: "Dewdrops on a fern leaf, slowly rolling and catching morning light",
            duration: 15,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-1",
            shotNumber: 3,
            shotType: "Medium Shot",
            description: "Mist rising from the forest floor between ancient tree trunks",
            duration: 25,
            cameraMovement: "pan-left",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
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
            description: "Gentle stream flowing over smooth stones, sunlight sparkling on water",
            duration: 20,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-2",
            shotNumber: 2,
            shotType: "Close-Up",
            description: "Water ripples creating natural patterns, light dancing on surface",
            duration: 15,
            cameraMovement: "slow zoom-in",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-3": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 1,
            shotType: "Wide Shot",
            description: "Shafts of light piercing through dense forest canopy, illuminating floating particles",
            duration: 20,
            cameraMovement: "tilt-up",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-3",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Ferns and leaves gently swaying in soft forest breeze",
            duration: 15,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-4": [
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 1,
            shotType: "Wide Shot",
            description: "Golden sunset light bathing the forest in warm amber tones",
            duration: 25,
            cameraMovement: "slow pan-right",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Silhouettes of trees against orange and purple twilight sky",
            duration: 20,
            cameraMovement: "static",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            sceneId: "scene-4",
            shotNumber: 3,
            shotType: "Wide Shot",
            description: "Final wide shot of peaceful forest as darkness gently settles",
            duration: 15,
            cameraMovement: "slow zoom-out",
            videoModel: null,
            imageModel: null,
            soundEffects: null,
            currentVersionId: null,
            transition: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Create dummy shot versions with placeholder images
      const dummyShotVersions: { [shotId: string]: ShotVersion[] } = {};
      Object.values(dummyShots).flat().forEach((shot, index) => {
        const versionId = `version-${shot.id}-1`;
        // More variety of nature/landscape images using picsum with different seeds
        const imageSeeds = [
          'forest-dawn', 'misty-mountains', 'dewdrop-leaf', 'ancient-trees', 
          'stream-stones', 'waterfall-mist', 'sunbeam-canopy', 'fern-closeup',
          'golden-hour', 'twilight-forest', 'peaceful-lake', 'moss-rocks'
        ];
        const seed = imageSeeds[index % imageSeeds.length];
        const imageUrl = `https://picsum.photos/seed/${seed}-${index}/800/450`;

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

    setSynopsis("A peaceful journey through a tranquil forest, from misty dawn to golden twilight. Experience the gentle beauty of nature as light plays through the canopy, water flows over ancient stones, and the forest transitions through the day's quiet moments.");
    onScenesGenerated(dummyScenes, dummyShots, dummyShotVersions);
  }, []);

  const moveScene = async (sceneId: string, direction: 'up' | 'down') => {
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

    onScenesGenerated(updatedScenes, shots);

    try {
      await Promise.all([
        apiRequest('PUT', `/api/narrative/scenes/${currentScene.id}`, { sceneNumber: targetScene.sceneNumber }),
        apiRequest('PUT', `/api/narrative/scenes/${targetScene.id}`, { sceneNumber: currentScene.sceneNumber }),
      ]);

      toast({ title: "Scene order updated" });
    } catch (error) {
      onScenesGenerated(scenes, shots);
      toast({
        title: "Failed to reorder scenes",
        description: "Please try again.",
        variant: "destructive",
      });
    }
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

    onScenesGenerated(updatedScenes, updatedShots);
  };

  const removeSceneData = (sceneId: string) => {
    const updatedScenes = scenes.filter(s => s.id !== sceneId);
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onScenesGenerated(updatedScenes, updatedShots);
  };

  const removeShotData = (shotId: string, sceneId: string) => {
    const updatedShots = { ...shots };
    if (updatedShots[sceneId]) {
      updatedShots[sceneId] = updatedShots[sceneId].filter(s => s.id !== shotId);
    }
    onScenesGenerated(scenes, updatedShots);
  };

  const breakdownMutation = useMutation({
    mutationFn: async () => {
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
      return response.json() as Promise<{ scenes: Scene[]; shots: { [sceneId: string]: Shot[] } }>;
    },
    onSuccess: (data) => {
      onScenesGenerated(data.scenes, data.shots);
      setSynopsis(script.substring(0, 200));
      toast({
        title: "Breakdown Complete",
        description: `Generated ${data.scenes.length} scenes with shots.`,
      });
    },
    onError: () => {
      toast({
        title: "Breakdown Failed",
        description: "Failed to analyze script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/narrative/scenes', { ...data, videoId });
      return await res.json() as Scene;
    },
    onSuccess: (scene: Scene) => {
      refreshSceneData(scene);
      toast({ title: "Scene created successfully" });
      setSceneDialogOpen(false);
      setEditingScene(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to create scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSceneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/narrative/scenes/${id}`, data);
      return await res.json() as Scene;
    },
    onSuccess: (scene: Scene) => {
      refreshSceneData(scene);
      toast({ title: "Scene updated successfully" });
      setSceneDialogOpen(false);
      setEditingScene(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to update scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/narrative/scenes/${id}`);
      return id;
    },
    onSuccess: (id: string) => {
      removeSceneData(id);
      toast({ title: "Scene deleted successfully" });
      setDeleteSceneId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createShotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/narrative/shots', { ...data, sceneId: activeSceneId });
      return await res.json() as Shot;
    },
    onSuccess: (shot: Shot) => {
      const scene = scenes.find(s => s.id === shot.sceneId);
      if (scene) refreshSceneData(scene, shot);
      toast({ title: "Shot created successfully" });
      setShotDialogOpen(false);
      setEditingShot(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to create shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateShotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/narrative/shots/${id}`, data);
      return await res.json() as Shot;
    },
    onSuccess: (shot: Shot) => {
      const scene = scenes.find(s => s.id === shot.sceneId);
      if (scene) refreshSceneData(scene, shot);
      toast({ title: "Shot updated successfully" });
      setShotDialogOpen(false);
      setEditingShot(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to update shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteShotMutation = useMutation({
    mutationFn: async (id: string) => {
      const shot = Object.values(shots).flat().find(s => s.id === id);
      await apiRequest('DELETE', `/api/narrative/shots/${id}`);
      return shot;
    },
    onSuccess: (shot) => {
      if (shot) removeShotData(shot.id, shot.sceneId);
      toast({ title: "Shot deleted successfully" });
      setDeleteShotId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSceneSubmit = async (data: any) => {
    if (editingScene) {
      await updateSceneMutation.mutateAsync({ id: editingScene.id, data });
    } else {
      await createSceneMutation.mutateAsync(data);
    }
  };

  const handleShotSubmit = async (data: any) => {
    if (editingShot) {
      await updateShotMutation.mutateAsync({ id: editingShot.id, data });
    } else {
      await createShotMutation.mutateAsync(data);
    }
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
    const newSceneData = {
      sceneNumber: scenes.length + 1,
      title: `${scene.title} (Copy)`,
      description: scene.description,
    };
    createSceneMutation.mutate(newSceneData);
  };

  const totalShots = Object.values(shots).flat().length;
  const totalDuration = scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);
  const hasBreakdown = scenes.length > 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design the Flow</h2>
        <p className="text-muted-foreground">
          Break down your ambient visual into segments and shots
        </p>
      </div>

      {!hasBreakdown ? (
        <div className="space-y-8">
          {/* Empty State - Generate or Add Manually */}
          <Card className="border-dashed border-2 border-white/10 bg-white/[0.02]">
            <CardContent className="py-16 px-8">
              <div className="text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                  <Sparkles className="h-8 w-8 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Design Your Flow</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    AI will analyze your atmosphere description and create visual segments with shots.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                    onClick={() => breakdownMutation.mutate()}
                    disabled={breakdownMutation.isPending}
                    data-testid="button-generate-breakdown"
                  >
                    {breakdownMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Segments...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Flow Design
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">or</span>
                  <Button
                    variant="outline"
                    onClick={openAddSceneDialog}
                    className="border-white/10 hover:bg-white/5"
                    data-testid="button-add-scene"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Segment Manually
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Synopsis - Always visible */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-cyan-400" />
                <Label className="text-lg font-semibold">Synopsis</Label>
              </div>
              <Textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Describe the overall story or mood of your ambient visual..."
                className="text-sm resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50"
                rows={3}
                data-testid="input-synopsis"
              />
            </CardContent>
          </Card>

          {/* Continuity Proposal - Only for Start-End Frame mode */}
          {narrativeMode === "start-end" && scenes.length > 0 && (
            <ContinuityProposal
              scenes={scenes}
              allShots={shots}
              proposedGroups={proposalDraft}
              approvedGroups={approvedGroups}
              declinedGroups={declinedGroups}
              isGenerating={isGeneratingContinuity}
              isLocked={localContinuityLocked}
              onGenerateProposal={handleGenerateContinuityProposal}
              onGroupApprove={handleGroupApprove}
              onGroupDecline={handleGroupDecline}
              onGroupEdit={handleGroupEdit}
              onLock={handleLock}
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
                <Card key={scene.id} className="bg-white/[0.02] border-white/[0.06]" data-testid={`scene-${scene.id}`}>
                  <CardContent className="p-6">
                    {/* Segment Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-cyan-400" />
                          <h3 className="text-lg font-semibold">
                            Segment {sceneIndex + 1}: {scene.title}
                          </h3>
                        </div>
                        <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50 text-xs px-2" data-testid={`scene-duration-${scene.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {scene.duration || 0}s
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                          onClick={() => duplicateScene(scene)}
                          data-testid={`button-copy-scene-${scene.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                          onClick={() => openEditSceneDialog(scene)}
                          data-testid={`button-edit-scene-${scene.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                          disabled={sceneIndex === 0}
                          onClick={() => moveScene(scene.id, 'up')}
                          data-testid={`button-move-up-scene-${scene.id}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                          disabled={sceneIndex === scenes.length - 1}
                          onClick={() => moveScene(scene.id, 'down')}
                          data-testid={`button-move-down-scene-${scene.id}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteSceneId(scene.id)}
                          data-testid={`button-delete-scene-${scene.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="relative space-y-2">
                      {/* Continuity arrows - Only for Start-End Frame mode */}
                      {narrativeMode === "start-end" && (
                        <ShotContinuityArrows
                          sceneId={scene.id}
                          sceneShots={sceneShots}
                          shotRefs={shotRefs}
                          proposedGroups={proposalDraft[scene.id] || []}
                          approvedGroups={approvedGroups[scene.id] || []}
                          isLocked={localContinuityLocked}
                          onApproveConnection={(shotId1, shotId2) => handleApproveConnection(scene.id, shotId1, shotId2)}
                          onDeclineConnection={(shotId1, shotId2) => handleDeclineConnection(scene.id, shotId1, shotId2)}
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
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                          data-testid={`shot-${shot.id}`}
                        >
                          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 mt-1.5 shrink-0 shadow-sm shadow-cyan-500/30" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground mr-2">Shot {shotIndex + 1}</span>
                            <span className="text-sm text-muted-foreground">{shot.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-xs text-white/70">
                              {shot.duration}s
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                              onClick={() => openEditShotDialog(shot, scene.id)}
                              data-testid={`button-edit-shot-${shot.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteShotId(shot.id)}
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
                        className="w-full mt-3 border border-dashed border-white/10 hover:bg-cyan-500/5 hover:border-cyan-500/50 text-muted-foreground hover:text-foreground"
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

            {/* Add Segment Button */}
            <Button
              variant="outline"
              onClick={openAddSceneDialog}
              className="w-full border-dashed border-white/10 hover:bg-cyan-500/5 hover:border-cyan-500/50"
              data-testid="button-add-scene"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>

          {/* Summary Footer */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-muted-foreground">Total Duration:</span>
                    <span className="font-semibold text-foreground">
                      {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span className="text-muted-foreground">Shots:</span>
                    <span className="font-semibold text-foreground">{totalShots}</span>
                  </div>
                </div>
                <Button 
                  onClick={onNext} 
                  variant="ghost"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  data-testid="button-next"
                >
                  Continue
                  <span className="ml-2">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <SceneDialog
            open={sceneDialogOpen}
            onOpenChange={setSceneDialogOpen}
            scene={editingScene}
            videoId={videoId}
            sceneCount={scenes.length}
            onSubmit={handleSceneSubmit}
            isPending={createSceneMutation.isPending || updateSceneMutation.isPending}
          />

          <ShotDialog
            open={shotDialogOpen}
            onOpenChange={setShotDialogOpen}
            shot={editingShot}
            sceneId={activeSceneId}
            shotCount={activeSceneId ? (shots[activeSceneId] || []).length : 0}
            onSubmit={handleShotSubmit}
            isPending={createShotMutation.isPending || updateShotMutation.isPending}
          />

          <AlertDialog open={!!deleteSceneId} onOpenChange={(open) => !open && setDeleteSceneId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Segment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this segment? This will also delete all shots in this segment. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-scene">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSceneId && deleteSceneMutation.mutate(deleteSceneId)}
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
                  onClick={() => deleteShotId && deleteShotMutation.mutate(deleteShotId)}
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
