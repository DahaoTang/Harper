/**
 * Linear API interfaces
 */

export interface WorkflowState {
  id: string;
  name: string;
  color?: string;
}

export interface LinearUser {
  id: string;
  name: string;
  displayName: string;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url: string;
  state?: WorkflowState;
  assignee?: LinearUser;
  labels?: {
    nodes: LinearLabel[];
  };
  priority?: number;
  estimate?: number;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * Types of Linear operations for the bot
 */
export type LinearOperationType =
  | "create"
  | "update"
  | "delete"
  | "find"
  | "unknown";

/**
 * Linear operation details for the bot
 */
export interface LinearOperation {
  type: LinearOperationType;
  title?: string;
  description?: string;
  cardId?: string;
  field?: string;
  value?: string;
  searchTerm?: string;
  searchById?: boolean;
  status?: string; // Used for both creation and updates
  assignee?: string; // Used for both creation and updates
  priority?: string; // Used for both creation and updates
  error?: string; // Error message for unknown operations
}
