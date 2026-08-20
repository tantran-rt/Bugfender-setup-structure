export interface Ticket {
  id: string;
  donorId: string;
  donorEmail: string;
  description: string;
  callRequested: boolean;
  callType: string;
  status:
    | "new"
    | "pending"
    | "active_call"
    | "transferred"
    | "resolved"
    | "closed";
  adminId: string;
  activeCallId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Define the API base URL
const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5005";
const API_BASE_URL = `${backendUrl}/api/v1`;

export async function getDonorQueries(donorId: string): Promise<Ticket[]> {
  const response = await fetch(`${API_BASE_URL}/tickets/donor/${donorId}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch donor queries");
  }

  return response.json();
}

export interface CreateTicketDto {
  donorId: string;
  donorEmail: string;
  description?: string;
  callType?: "audio" | "video";
}

/**
 * Updates a ticket's status to RESOLVED from the donor side
 * @param ticketId The ID of the ticket to resolve
 * @param donorId The ID of the donor
 * @returns The updated ticket
 */
export async function resolveDonorQuery(
  ticketId: string,
  donorId: string
): Promise<Ticket> {
  const response = await fetch(
    `${API_BASE_URL}/tickets/${ticketId}/donor/${donorId}/resolve`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      // No need for request body as donorId is in the path
    }
  );

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error: any = new Error(
        errorData.message || "Failed to resolve ticket"
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseData = errorData;
      throw error;
    } catch (parseError) {
      const error: any = new Error(
        `Failed to resolve ticket (${response.status})`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }
  }

  return response.json();
}

/**
 * Interface for the response from the start-call endpoint
 */
export interface StartCallResponse {
  id: string;
  donorId: string;
  donorEmail: string;
  description: string;
  callRequested: boolean;
  callType: string;
  status: string;
  adminId: string | null;
  activeCallId: string;
  createdAt: string;
  updatedAt: string;
  call: {
    id: string;
    dailyRoomUrl: string;
    status: string;
    userToken: string;
  };
}

/**
 * Creates a new donor query and immediately starts a direct call
 * @param queryData Data required to create the query and start a call
 * @returns Query details and call joining information
 */
export async function startDonorCall(
  queryData: CreateTicketDto
): Promise<StartCallResponse> {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(queryData),
  });

  if (!response.ok) {
    // Try to extract the error details from the response
    try {
      const errorData = await response.json();
      // Create an error with the response status and message
      const error: any = new Error(
        errorData.message || "Failed to start donor call"
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseData = errorData;
      throw error;
    } catch (parseError) {
      // If we can't parse the JSON, just throw a generic error with status
      const error: any = new Error(
        `Failed to start donor call (${response.status})`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }
  }

  return response.json();
}

/**
 * Interface for the call response
 */
export interface CallResponse {
  id: string;
  ticketId: string;
  dailyRoomUrl: string;
  status: string;
  callType: string;
  initiatedBy: string;
  startedAt: string;
  endedAt: null | string;
  createdAt: string;
  updatedAt: string;
  userToken: string;
}

/**
 * Starts a new call for an existing ticket
 * @param ticketId The ID of the ticket to create a call for
 * @param callType The type of call (audio or video)
 * @returns Call details including the room URL and user token
 */
export async function startCall(
  ticketId: string,
  callType: "audio" | "video"
): Promise<CallResponse> {
  const response = await fetch(`${API_BASE_URL}/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      ticketId,
      callType,
      initiatedBy: "donor",
    }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || "Failed to start call");
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseData = errorData;
      throw error;
    } catch (parseError) {
      const error: any = new Error(`Failed to start call (${response.status})`);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }
  }

  return response.json();
}

export async function endCall(callId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/${callId}/end`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from API (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error ending call ${callId}:`, error);
    return false;
  }
}
