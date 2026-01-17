import { v4 as uuidv4 } from "uuid";

const USER_UUID_KEY = "x-user-uuid";
const USER_DISPLAY_NAME_KEY = "x-user-display-name";
const USER_UUID_MAPPING_KEY = "user-uuid-mapping";

/**
 * Get or create a UUID for a display name (pseudo-user identifier).
 * Maps display names to UUIDs persistently in localStorage.
 */
export function getOrCreateUserId(displayName: string): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateUserId can only be called on the client");
  }

  // Get or create the mapping object
  const mappingStr = localStorage.getItem(USER_UUID_MAPPING_KEY);
  let mapping: Record<string, string> = {};
  
  if (mappingStr) {
    try {
      mapping = JSON.parse(mappingStr);
    } catch {
      // If parsing fails, start fresh
      mapping = {};
    }
  }

  // Check if UUID already exists for this display name
  if (mapping[displayName]) {
    return mapping[displayName];
  }

  // Generate new UUID and store mapping
  const uuid = uuidv4();
  mapping[displayName] = uuid;
  localStorage.setItem(USER_UUID_MAPPING_KEY, JSON.stringify(mapping));

  return uuid;
}

/**
 * Get the current user's UUID from localStorage.
 * Returns null if no user is logged in.
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(USER_UUID_KEY);
}

/**
 * Get the current user's display name from localStorage.
 * Returns null if no user is logged in.
 */
export function getDisplayName(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(USER_DISPLAY_NAME_KEY);
}

/**
 * Set the current user's UUID and display name in localStorage.
 */
export function setUserData(uuid: string, displayName: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(USER_UUID_KEY, uuid);
  localStorage.setItem(USER_DISPLAY_NAME_KEY, displayName);
}

/**
 * Clear all user data from localStorage (on logout).
 * Optionally clears the UUID mapping as well (default: false, to preserve mapping across sessions).
 */
export function clearUserData(clearMapping: boolean = false): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(USER_UUID_KEY);
  localStorage.removeItem(USER_DISPLAY_NAME_KEY);
  if (clearMapping) {
    localStorage.removeItem(USER_UUID_MAPPING_KEY);
  }
}
