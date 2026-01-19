import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit, Trash2, Plus, Copy, ChevronUp, ChevronDown, FileText, Layers, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
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
  scriptModel: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  continuityGenerated?: boolean; // Track if continuity has been analyzed (one-time only)
  videoModel?: string; // Video model from atmosphere phase
  animationMode: 'image-transitions' | 'video-animation'; // Animation mode for camera movements
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
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
  continuityGenerated = false,
  videoModel,
  animationMode,
  onScenesGenerated, 
  onContinuityLocked,
  onContinuityGroupsChange,
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
  const [continuityInitialized, setContinuityInitialized] = useState(false);
  
  // Create a stable key based on the total number of groups to detect data changes
  const propsGroupCount = Object.values(propsGroups).flat().length;
  const propsGroupsKey = `${Object.keys(propsGroups).join(',')}-${propsGroupCount}`;
  
  // Initialize from propsGroups by separating approved vs proposed vs declined
  // This runs when propsGroups changes (e.g., restored from database)
  useEffect(() => {
    const propsHaveData = propsGroupCount > 0;
    
    console.log('[SceneBreakdown] Continuity effect triggered:', {
      propsHaveData,
      propsGroupCount,
      propsGroupsKey,
      continuityInitialized,
    });
    
    // Skip if already initialized and props are empty (user cleared them)
    if (continuityInitialized && !propsHaveData) {
      return; // Already initialized, don't reset
    }
    
    // Skip if no data to initialize from yet
    if (!propsHaveData) {
      return;
    }
    
    console.log('[SceneBreakdown] Initializing continuity groups from props:', {
      groupCount: propsGroupCount,
      scenes: Object.keys(propsGroups),
    });
    
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
    setContinuityInitialized(true);
    
    console.log('[SceneBreakdown] Continuity groups initialized:', {
      approved: Object.values(approved).flat().length,
      proposed: Object.values(proposed).flat().length,
      declined: Object.values(declined).flat().length,
    });
  }, [propsGroupsKey]); // Use stable key to detect changes
  
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
  
  // Update all three maps (local state only - do NOT notify parent during approvals)
  const updateAllGroupMaps = (
    approved: { [sceneId: string]: ContinuityGroup[] },
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    // Always update local state for all groups (needed for Flow phase UI)
    setLocalApprovedGroups(approved);
    setLocalProposalDraft(proposed);
    setLocalDeclinedGroups(declined);
    
    // DO NOT notify parent here - only sync on Lock via API call
    // This prevents re-initialization that wipes pending proposals
    // The parent callback was causing the bug where approving one group
    // would pass only approved groups to parent, which then re-initialized
    // the local state from props, wiping out all pending proposals
  };

  // Sync local lock state with prop when it changes
  useEffect(() => {
    setLocalContinuityLocked(continuityLocked);
  }, [continuityLocked]);

  const handleGenerateContinuityProposal = async () => {
    setIsGeneratingContinuity(true);
    try {
      // Call the AI Continuity Producer agent via API
      const response = await fetch('/api/ambient-visual/flow-design/continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate continuity proposals');
      }

      const data = await response.json() as {
        continuityGroups: { [sceneId: string]: ContinuityGroup[] };
        cost?: number;
      };

      const newGroups = data.continuityGroups || {};

      if (Object.keys(newGroups).length === 0) {
        toast({
          title: "No Continuity Proposals",
          description: "AI couldn't find suitable shot sequences for continuity connections. Try adding more shots or adjusting their descriptions.",
        });
        return;
      }

      // Set new proposals (preserves existing approved and declined groups)
      updateAllGroupMaps(approvedGroups, newGroups, declinedGroups);

      toast({
        title: "Continuity Proposal Generated",
        description: `AI generated proposals for ${Object.keys(newGroups).length} scene${Object.keys(newGroups).length !== 1 ? 's' : ''}. Review and approve to proceed.`,
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

  const [isLocking, setIsLocking] = useState(false);

  const handleLock = async () => {
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

    setIsLocking(true);

    try {
      // Save approved continuity groups to database
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/continuity/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ continuityGroups: approvedGroups }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lock continuity');
      }

      // Set local lock state after successful save
      setLocalContinuityLocked(true);
      
      // IMPORTANT: Update parent state with approved groups before locking
      // This ensures the parent's validation logic has access to the correct
      // group statuses (approved vs proposed) for the Continue button
      if (onContinuityGroupsChange) {
        // Merge all groups with updated statuses for parent
        const allGroupsForParent = mergeAllGroups(approvedGroups, {}, declinedGroups);
        onContinuityGroupsChange(allGroupsForParent);
      }
      
      // Update parent state to lock continuity
      if (onContinuityLocked) {
        onContinuityLocked();
      }

      toast({
        title: "Continuity Locked",
        description: "Shot connections saved and locked. Proceeding to storyboard generation.",
      });
    } catch (error) {
      console.error('[SceneBreakdown] Failed to lock continuity:', error);
      toast({
        title: "Lock Failed",
        description: error instanceof Error ? error.message : "Failed to save continuity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLocking(false);
    }
  };

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

    onScenesGenerated(updatedScenes, shots);
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

  const handleGenerateBreakdown = async () => {
    try {
      const response = await fetch('/api/ambient-visual/flow-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flow design');
      }
      const data = await response.json() as { 
        scenes: Scene[]; 
        shots: { [sceneId: string]: Shot[] };
        shotVersions?: { [shotId: string]: ShotVersion[] };
        continuityGroups?: { [sceneId: string]: import("@/types/storyboard").ContinuityGroup[] };
        totalDuration?: number;
        cost?: number;
      };
      
      onScenesGenerated(data.scenes, data.shots, data.shotVersions);
      
      // Update continuity groups if provided
      if (data.continuityGroups && onContinuityGroupsChange) {
        onContinuityGroupsChange(data.continuityGroups);
      }
      
      // Set synopsis from script/mood description
      setSynopsis(script ? script.substring(0, 200) : 'AI-generated ambient visual flow');
      toast({
        title: "Flow Design Complete",
        description: `Generated ${data.scenes.length} segments with ${Object.values(data.shots).flat().length} shots.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate flow design';
      toast({
        title: "Generation Failed",
        description: message,
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design the Flow</h2>
        <p className="text-muted-foreground">
          Break down your ambient visual into segments and shots
        </p>
      </div>

      {hasBreakdown && (
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
              isLocking={isLocking}
              isLocked={localContinuityLocked}
              continuityGenerated={continuityGenerated}
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
                          {(() => {
                            // Calculate actual duration from shots if available, otherwise use scene target duration
                            const sceneShots = shots[scene.id] || [];
                            const calculatedDuration = sceneShots.reduce((sum, shot) => sum + (shot.duration || 0), 0);
                            // Use calculated duration if shots exist, otherwise fall back to scene target duration
                            return calculatedDuration > 0 ? calculatedDuration : (scene.duration || 0);
                          })()}s
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

          </div>

          {/* Summary Footer */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>

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
            videoModel={videoModel}
            animationMode={animationMode}
            onSubmit={handleShotSubmit}
            isPending={false}
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
