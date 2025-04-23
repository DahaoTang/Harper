import fetch from "node-fetch";
import { WorkflowState, LinearUser, LinearIssue } from "@/lib/types/linear";
import { generateChatCompletion } from "@/lib/adapters/openai/api";

/**
 * Linear API client for interacting with Linear issue tracking system
 */

// Type definitions
interface LinearError {
  message: string;
}

interface LinearResponse<T> {
  data?: T;
  errors?: LinearError[];
}

interface IssueCreateResponse {
  issueCreate: {
    success: boolean;
    issue: LinearIssue;
  };
}

interface IssueUpdateResponse {
  issueUpdate: {
    success: boolean;
    issue: LinearIssue;
  };
}

interface IssueDeleteResponse {
  issueDelete: {
    success: boolean;
  };
}

interface SearchIssuesResponse {
  issues: {
    nodes: LinearIssue[];
  };
}

interface GetWorkflowStatesResponse {
  workflowStates: {
    nodes: WorkflowState[];
  };
}

// Configuration
const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
const DEFAULT_TEAM_ID = process.env.LINEAR_TEAM_ID || "";

// Validate configuration on module load
if (!LINEAR_API_KEY) {
  console.warn(
    "⚠️ LINEAR_API_KEY environment variable is not set. Linear integration will not work."
  );
}

if (!DEFAULT_TEAM_ID) {
  console.warn(
    "⚠️ LINEAR_TEAM_ID environment variable is not set. A team ID will be required for each operation."
  );
}

/**
 * GraphQL request to Linear API
 */
async function linearRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!LINEAR_API_KEY) {
    throw new Error("LINEAR_API_KEY is not configured");
  }

  try {
    console.log(
      "Sending Linear API request with variables:",
      JSON.stringify(variables)
    );

    const response = await fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: LINEAR_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = (await response.json()) as LinearResponse<T>;

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map((e) => e.message).join(", ");
      console.error("Linear API returned errors:", result.errors);
      throw new Error(`Linear API error: ${errorMessage}`);
    }

    if (!result.data) {
      throw new Error("Linear API returned empty data");
    }

    return result.data;
  } catch (error) {
    console.error("Linear API request failed:", error);
    throw error;
  }
}

/**
 * Use AI to interpret card creation input
 */
async function interpretCardCreationInput(input: string): Promise<{
  title: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
}> {
  if (!input.trim()) {
    throw new Error("Input is required for card creation");
  }

  const prompt = `
You are helping to interpret a user's input for creating a Linear card.
The user provided the following unstructured input, which might contain information about multiple card fields:

User input: "${input}"

Extract the following information from this input:
1. A concise title (required, should be brief but descriptive)
2. A more detailed description (optional)
3. Status (optional, values like "Todo", "In Progress", "Done", etc.)
4. Assignee (optional, typically a person's name)
5. Priority (optional, values like "No Priority", "Urgent", "High", "Medium", "Low")

Format your response as JSON:
{
  "title": "Brief title",
  "description": "More detailed description",
  "status": "Status value if present",
  "assignee": "Person's name if present",
  "priority": "Priority level if present"
}

Only include fields that are clearly present in the input. Do not make up information.
`;

  try {
    const completion = await generateChatCompletion(
      [{ role: "user", content: prompt }],
      "gpt-4o-mini"
    );

    if (!completion) {
      throw new Error("Failed to interpret card creation input");
    }

    try {
      // Extract the JSON from the response
      const jsonMatch = completion.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      const parsed = JSON.parse(jsonString);

      console.log(
        `AI interpreted card creation input. Original input: "${input}". Interpreted:`,
        parsed
      );

      if (!parsed.title) {
        throw new Error("Title is required for card creation");
      }

      return {
        title: parsed.title,
        description: parsed.description,
        status: parsed.status,
        assignee: parsed.assignee,
        priority: parsed.priority,
      };
    } catch (jsonError) {
      console.error("Failed to parse JSON from completion:", jsonError);
      throw new Error("Failed to interpret card creation input");
    }
  } catch (error) {
    console.error("Error interpreting card creation input:", error);
    throw new Error(`Failed to interpret input: ${error}`);
  }
}

/**
 * Create a new issue in Linear
 * @param input - Unstructured input text that will be interpreted to extract all card fields
 * @param teamId - Optional team ID (defaults to environment variable)
 * @returns The created Linear issue
 */
export async function createCard(input: string, teamId?: string) {
  const team = teamId || DEFAULT_TEAM_ID;

  if (!team) {
    throw new Error("Team ID is required but not provided");
  }

  // Interpret the input to handle unstructured inputs
  const interpretedInput = await interpretCardCreationInput(input);

  // Prepare the mutation input
  interface IssueCreateInputType {
    title: string;
    description?: string;
    teamId: string;
    stateId?: string;
    assigneeId?: string;
    priority?: number;
  }

  const createInput: IssueCreateInputType = {
    title: interpretedInput.title,
    description: interpretedInput.description,
    teamId: team,
  };

  // Add status/state ID if provided
  if (interpretedInput.status) {
    try {
      // Get available states
      const states = await getWorkflowStates(team);
      if (states.length > 0) {
        // Match the user's value to available states
        const matchedState = await matchValueToOptions(
          interpretedInput.status,
          "status",
          states
        );

        // Find the state ID
        const targetState = states.find(
          (state) => state.name.toLowerCase() === matchedState.toLowerCase()
        );

        if (targetState) {
          createInput.stateId = targetState.id;
        }
      }
    } catch (error) {
      console.warn("Could not set initial status:", error);
    }
  }

  // Add assignee if provided
  if (interpretedInput.assignee) {
    try {
      // Get available users
      const users = await getTeamMembers(team);
      if (users.length > 0) {
        // Match the user's value to available users
        const matchedUser = await matchValueToOptions(
          interpretedInput.assignee,
          "assignee",
          users
        );

        // Find the user ID
        const targetUser = users.find(
          (user) => user.displayName.toLowerCase() === matchedUser.toLowerCase()
        );

        if (targetUser) {
          createInput.assigneeId = targetUser.id;
        }
      }
    } catch (error) {
      console.warn("Could not set assignee:", error);
    }
  }

  // Add priority if provided
  if (interpretedInput.priority) {
    try {
      // Match the priority
      const matchedPriority = await matchValueToOptions(
        interpretedInput.priority,
        "priority",
        []
      );

      // Convert to numeric value
      const priorityMapping: Record<string, number> = {
        "No Priority": 0,
        Urgent: 1,
        High: 2,
        Medium: 3,
        Low: 4,
      };

      const priorityValue = priorityMapping[matchedPriority];
      if (priorityValue !== undefined) {
        createInput.priority = priorityValue;
      }
    } catch (error) {
      console.warn("Could not set priority:", error);
    }
  }

  const createQuery = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          description
          url
          priority
          state {
            id
            name
          }
          assignee {
            id
            name
            displayName
          }
        }
      }
    }
  `;

  const variables = {
    input: createInput,
  };

  const data = await linearRequest<IssueCreateResponse>(createQuery, variables);
  return data.issueCreate.issue;
}

/**
 * Find card by ID or search terms
 */
export async function findCard(
  searchTerm: string,
  teamId?: string
): Promise<LinearIssue[]> {
  const team = teamId || DEFAULT_TEAM_ID;

  if (!team) {
    throw new Error("Team ID is required but not provided");
  }

  // Check if searchTerm is an identifier (like PRO-16)
  const isIdentifier = /^([A-Z]+)-(\d+)$/.test(searchTerm);

  if (isIdentifier) {
    // Extract issue number from the identifier (e.g., "PRO-16" -> "16")
    const [, , issueNumber] = searchTerm.match(/^([A-Z]+)-(\d+)$/) || [];

    // Search by issue number
    const query = `
      query IssueByIdentifier($filter: IssueFilter) {
        issues(
          filter: $filter
          first: 1
        ) {
          nodes {
            id
            identifier
            title
            description
            url
            priority
            state {
              id
              name
            }
            assignee {
              id
              name
              displayName
            }
            updatedAt
            createdAt
          }
        }
      }
    `;

    const data = await linearRequest<SearchIssuesResponse>(query, {
      filter: {
        team: { id: { eq: team } },
        number: { eq: parseInt(issueNumber) },
      },
    });

    return data.issues.nodes;
  } else {
    // Search by terms in title or description
    const searchQuery = `
      query SearchIssues($filter: IssueFilter) {
        issues(
          filter: $filter
          first: 10
          orderBy: updatedAt
        ) {
          nodes {
            id
            identifier
            title
            description
            url
            priority
            state {
              id
              name
            }
            assignee {
              id
              name
              displayName
            }
            updatedAt
            createdAt
          }
        }
      }
    `;

    const variables = {
      filter: {
        team: { id: { eq: team } },
        or: [
          { title: { containsIgnoreCase: searchTerm } },
          { description: { containsIgnoreCase: searchTerm } },
        ],
      },
    };

    const data = await linearRequest<SearchIssuesResponse>(
      searchQuery,
      variables
    );
    return data.issues.nodes;
  }
}

/**
 * Get all available workflow states for a team
 */
async function getWorkflowStates(teamId: string): Promise<WorkflowState[]> {
  const findStateQuery = `
    query WorkflowStates($filter: WorkflowStateFilter) {
      workflowStates(filter: $filter) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const statesData = await linearRequest<GetWorkflowStatesResponse>(
    findStateQuery,
    {
      filter: { team: { id: { eq: teamId } } },
    }
  );

  return statesData.workflowStates.nodes;
}

/**
 * Get all team members
 */
async function getTeamMembers(teamId: string): Promise<LinearUser[]> {
  // Query team memberships to get users assigned to this team
  const findTeamMembersQuery = `
    query TeamMembers($teamId: String!) {
      team(id: $teamId) {
        members {
          nodes {
            id
            name
            displayName
          }
        }
      }
    }
  `;

  interface TeamMembersResponse {
    team: {
      members: {
        nodes: LinearUser[];
      };
    };
  }

  const membersData = await linearRequest<TeamMembersResponse>(
    findTeamMembersQuery,
    {
      teamId,
    }
  );

  // Extract the user data
  if (!membersData.team || !membersData.team.members) {
    throw new Error(`Failed to get members for team ${teamId}`);
  }

  return membersData.team.members.nodes;
}

/**
 * Use AI to interpret a user's field name into a valid Linear field
 */
async function interpretFieldName(userInput: string): Promise<string> {
  const validFields = [
    "title",
    "description",
    "status",
    "assignee",
    "priority",
  ];

  const prompt = `
You are helping to interpret a user's input for updating a Linear card.
The user wants to update a field but may not have used the exact field name.

Valid Linear card fields are: ${validFields.join(", ")}

User input field name: "${userInput}"

Based on the user's input, which valid field are they most likely referring to? 
Respond with just the valid field name, nothing else.
`;

  try {
    const completion = await generateChatCompletion(
      [{ role: "user", content: prompt }],
      "gpt-4o-mini"
    );

    if (!completion) {
      throw new Error("Failed to interpret field name");
    }

    // Extract just the field name from the completion
    const fieldName = completion.trim().toLowerCase();

    // Validate that the returned field is one of our valid fields
    if (!validFields.includes(fieldName)) {
      throw new Error(`"${fieldName}" is not a valid field name`);
    }

    console.log(`AI interpreted field "${userInput}" as "${fieldName}"`);
    return fieldName;
  } catch (error) {
    console.error("Error interpreting field name:", error);
    throw new Error(
      `Couldn't interpret "${userInput}" as a valid field name. Valid fields are: ${validFields.join(
        ", "
      )}`
    );
  }
}

/**
 * Use AI to match a user's input value to an available option
 */
async function matchValueToOptions(
  userValue: string,
  fieldName: string,
  availableOptions: WorkflowState[] | LinearUser[] | never[]
): Promise<string> {
  // Format the options into a string based on the field type
  let optionsString = "";
  let optionNames: string[] = [];

  if (fieldName === "status") {
    optionNames = (availableOptions as WorkflowState[]).map(
      (state) => state.name
    );
    optionsString = optionNames.join(", ");
  } else if (fieldName === "assignee") {
    optionNames = (availableOptions as LinearUser[]).map(
      (user) => user.displayName
    );
    optionsString = optionNames.join(", ");
  } else if (fieldName === "priority") {
    optionNames = ["No Priority", "Urgent", "High", "Medium", "Low"];
    optionsString = optionNames.join(", ");
  }

  // If no options are available, provide a helpful error
  if (optionNames.length === 0 && fieldName !== "priority") {
    throw new Error(`No available options found for ${fieldName}`);
  }

  const prompt = `
You are helping to match a user's input to a valid option in Linear.
The user wants to update the "${fieldName}" field but may not have used the exact value.

Available options for "${fieldName}" are: ${optionsString}

User's input value: "${userValue}"

Which of the available options is the closest match to what the user intended?
Respond with just the exact option name as listed above, nothing else.
`;

  try {
    const completion = await generateChatCompletion(
      [{ role: "user", content: prompt }],
      "gpt-4o-mini"
    );

    if (!completion) {
      throw new Error(`Failed to match value for ${fieldName}`);
    }

    // Extract just the matched value
    const matchedValue = completion.trim();

    // Verify the matched value is in our options
    if (
      !optionNames.some(
        (option) => option.toLowerCase() === matchedValue.toLowerCase()
      )
    ) {
      throw new Error(
        `"${matchedValue}" is not a valid option for ${fieldName}`
      );
    }

    console.log(
      `AI matched "${userValue}" to "${matchedValue}" for field "${fieldName}"`
    );
    return matchedValue;
  } catch (error) {
    console.error(`Error matching ${fieldName} value:`, error);
    throw new Error(
      `Couldn't match "${userValue}" to a valid option for ${fieldName}. Available options are: ${optionsString}`
    );
  }
}

/**
 * Update a Linear card with specified field and value
 */
export async function updateCard(
  identifier: string,
  field: string,
  value: string,
  teamId?: string
): Promise<LinearIssue> {
  const team = teamId || DEFAULT_TEAM_ID;

  if (!team) {
    throw new Error("Team ID is required but not provided");
  }

  // First find the card to get its internal ID
  const cards = await findCard(identifier, team);

  if (!cards || cards.length === 0) {
    throw new Error(`Card with identifier "${identifier}" not found`);
  }

  const card = cards[0];
  const internalId = card.id;

  // Interpret the field name using AI
  const interpretedField = await interpretFieldName(field);

  // Map fields to their API property names
  const fieldMapping: Record<string, string> = {
    title: "title",
    description: "description",
    status: "stateId",
    assignee: "assigneeId",
    priority: "priority",
  };

  const mappedField = fieldMapping[interpretedField];
  let updateValue: string | number | null = value;

  // Special handling for certain fields
  if (mappedField === "stateId") {
    try {
      // Get available states
      const states = await getWorkflowStates(team);

      if (states.length === 0) {
        throw new Error(`No workflow states found for team ${team}`);
      }

      // Match the user's value to available states
      const matchedState = await matchValueToOptions(value, "status", states);

      // Find the state ID
      const targetState = states.find(
        (state) => state.name.toLowerCase() === matchedState.toLowerCase()
      );

      if (!targetState) {
        throw new Error(
          `Status "${matchedState}" not found in available states`
        );
      }

      updateValue = targetState.id;
    } catch (error) {
      console.error("Error updating status:", error);
      throw new Error(
        `Failed to update status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } else if (mappedField === "assigneeId" && value) {
    try {
      // Get available users
      console.log(`Getting team members for team ${team}`);
      const users = await getTeamMembers(team);

      if (users.length === 0) {
        throw new Error(`No team members found for team ${team}`);
      }

      console.log(
        `Found ${users.length} team members. Available assignees:`,
        users.map((u) => `${u.displayName} (${u.id})`).join(", ")
      );

      // Match the user's value to available users
      const matchedUser = await matchValueToOptions(value, "assignee", users);
      console.log(
        `Matched user input "${value}" to team member "${matchedUser}"`
      );

      // Find the user ID
      const targetUser = users.find(
        (user) => user.displayName.toLowerCase() === matchedUser.toLowerCase()
      );

      if (!targetUser) {
        throw new Error(`User "${matchedUser}" not found in team members list`);
      }

      console.log(
        `Using user ID ${targetUser.id} for assignee ${targetUser.displayName}`
      );
      updateValue = targetUser.id;
    } catch (error) {
      console.error("Error updating assignee:", error);
      throw new Error(
        `Failed to update assignee: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } else if (mappedField === "priority") {
    // Define priority options (these are fixed in Linear)
    const priorityMapping: Record<string, number> = {
      "No Priority": 0,
      Urgent: 1,
      High: 2,
      Medium: 3,
      Low: 4,
    };

    // Match the user's value to available priority levels
    const matchedPriority = await matchValueToOptions(value, "priority", []);

    updateValue = priorityMapping[matchedPriority];
    if (updateValue === undefined) {
      throw new Error(`Priority "${matchedPriority}" not recognized`);
    }
  }

  // Build update query
  const updateQuery = `
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
          description
          url
          priority
          state {
            id
            name
          }
          assignee {
            id
            name
            displayName
          }
          updatedAt
          createdAt
        }
      }
    }
  `;

  const updateInput: Record<string, string | number | null> = {};
  updateInput[mappedField] = updateValue;

  const variables = {
    id: internalId,
    input: updateInput,
  };

  const data = await linearRequest<IssueUpdateResponse>(updateQuery, variables);
  return data.issueUpdate.issue;
}

/**
 * Delete a Linear card by identifier
 */
export async function deleteCard(
  identifier: string,
  teamId?: string
): Promise<boolean> {
  const team = teamId || DEFAULT_TEAM_ID;

  if (!team) {
    throw new Error("Team ID is required but not provided");
  }

  // First find the card to get its internal ID
  const cards = await findCard(identifier, team);

  if (!cards || cards.length === 0) {
    throw new Error(`Card with identifier "${identifier}" not found`);
  }

  const internalId = cards[0].id;

  // Delete the card
  const deleteQuery = `
    mutation DeleteIssue($id: String!) {
      issueDelete(id: $id) {
        success
      }
    }
  `;

  const data = await linearRequest<IssueDeleteResponse>(deleteQuery, {
    id: internalId,
  });

  return data.issueDelete.success;
}
