// Character Management Entry Point

// Re-export API client functions
export {
  listCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  uploadMainImage,
} from "./routes";

// Re-export types
export type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterResponse,
  UploadImageResponse,
} from "./types";

