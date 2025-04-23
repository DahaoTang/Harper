/**
 * Linear API client placeholder
 *
 * This will be implemented in future to handle Linear board operations:
 * - Creating cards
 * - Moving cards between states
 * - Deleting cards
 * - Reading card information
 */

// For future implementation
export async function createCard(title: string, description?: string) {
  console.log(title, description);
  throw new Error("Linear API not yet implemented");
}

export async function moveCard(cardId: string, status: string) {
  console.log(cardId, status);
  throw new Error("Linear API not yet implemented");
}

export async function deleteCard(cardId: string) {
  console.log(cardId);
  throw new Error("Linear API not yet implemented");
}

export async function getCard(cardId: string) {
  console.log(cardId);
  throw new Error("Linear API not yet implemented");
}
