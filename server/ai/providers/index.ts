/**
 * Importing provider adapters has the side-effect of registering them
 * with the provider registry defined in `base-provider`.
 */
import "./openai";
import "./gemini";
import "./runware";

export { getProviderAdapter, listRegisteredProviders } from "./base-provider";

