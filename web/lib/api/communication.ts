import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';
const API_BASE_URL = `${backendUrl}/api/v1`;

export enum CallMode {
  VIDEO = 'video',
  AUDIO = 'audio'
}

export interface CallSession {
  id: string;
  queryId: string;
  roomName: string;
  mode: CallMode;
  status: string;
  createdAt: string;
}

export interface CallRequestResponse {
  success: boolean;
  message: string;
  data: {
    message: {
      id: string;
      content: string;
      queryId: string;
      messageType: 'SYSTEM';
      callMode: CallMode;
      createdAt: string;
    };
    query: {
      id: string;
      // Other query details will be included
    };
  };
}

/**
 * Update the status of a call
 */
export async function updateCallStatus(roomName: string, status: string) {
  try {    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call/${roomName}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update call status');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating call status:', error);
    throw error;
  }
}

/**
 * Get call sessions for a specific query
 */
export async function getCallSessions(queryId: number) {
  try {    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/calls/${queryId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get call sessions');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting call sessions:', error);
    throw error;
  }
}


/**
 * Request a call session for a specific donor query
 */
export async function requestCall(queryId: string, mode: CallMode = CallMode.VIDEO): Promise<CallRequestResponse> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call/${queryId}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode }),
    });

    if (!response.ok) {
      throw new Error('Failed to request call');
    }

    return response.json();
  } catch (error) {
    console.error('Error requesting call:', error);
    throw error;
  }
}


/**
 * Get call request history for a specific query
 * @param queryId The ID of the query
 * @returns Array of call requests
 */
export async function getCallRequestHistory(queryId: number) {
  try {
        // Construct URL with query parameter
    const url = new URL(`${API_BASE_URL}/communication/call-requests`);
    url.searchParams.append('queryId', queryId.toString());
    
    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching call request history:', error);
    throw error;
  }
}

/**
 * Start a direct call for a specific donor query without requiring admin approval
 */
export async function startDirectCall(queryId: string, mode: CallMode = CallMode.VIDEO) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call/${queryId}/direct-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callType: mode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start direct call');
    }

    return response.json();
  } catch (error) {
    console.error('Error starting direct call:', error);
    throw error;
  }
}

