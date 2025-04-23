/**
 * Supported intent types
 */
export type IntentType = "general" | "linear" | "github" | "welcome";

/**
 * Response from an intent handler
 */
export interface IntentResponse {
  text: string;
  attachments?: unknown[];
  blocks?: unknown[];
}

/**
 * Intent context with message and channel information
 */
export interface IntentContext {
  message: string;
  channel: string;
  userId?: string;
}
