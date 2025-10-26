/**
 * User preferences for URL canonicalization and duplicate detection
 */
export interface UserPreferences {
    removeTrackingParams: boolean;
    // Future preferences can be added here
}

const DEFAULT_PREFERENCES: UserPreferences = {
    removeTrackingParams: true,
};

/**
 * Get user preferences from Chrome storage
 */
export async function getUserPreferences(): Promise<UserPreferences> {
    try {
        const result = await chrome.storage.local.get(['userPreferences']);
        return result.userPreferences || DEFAULT_PREFERENCES;
    } catch (error) {
        console.warn('Failed to load user preferences, using defaults:', error);
        return DEFAULT_PREFERENCES;
    }
}

/**
 * Save user preferences to Chrome storage
 */
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
        await chrome.storage.local.set({ userPreferences: preferences });
    } catch (error) {
        console.error('Failed to save user preferences:', error);
        throw error;
    }
}
