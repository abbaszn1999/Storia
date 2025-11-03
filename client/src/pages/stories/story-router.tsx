import { useRoute } from "wouter";
import ASMRGenerator from "./asmr";
import StoryCreate from "./create/[template]";

export default function StoryRouter() {
  const [, params] = useRoute("/stories/create/:template");
  
  // Route to ASMR single-page interface for asmr-sensory template
  if (params?.template === "asmr-sensory") {
    return <ASMRGenerator />;
  }
  
  // Route to multi-step workflow for all other templates
  return <StoryCreate />;
}
