// Location Management Entry Point

// Re-export API client functions
export {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadMainImage,
} from "./routes";

// Re-export types
export type {
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationResponse,
  UploadImageResponse,
} from "./types";

