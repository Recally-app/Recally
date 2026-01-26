# Import/Export Feature Implementation

## Overview
The import/export feature allows users to backup and restore their Recally data, including posts (saved tabs), folders, and pinned tabs configuration.

## Features Implemented

### 1. Export Functionality
- **Location**: Settings modal → Data section → Export button
- **Functionality**: Downloads all Recally data as a JSON file
- **Data Included**:
  - All saved posts (tabs) with metadata (title, URL, tags, notes, favicon)
  - All folders with their configurations (name, color, post associations)
  - Pinned tabs configuration
- **File Format**: `recally-backup-YYYY-MM-DD.json`

### 2. Import Functionality
- **Location**: Settings modal → Data section → Import dropdown
- **Import Modes**:
  
  **Merge Mode**:
  - Adds imported data to existing data
  - Combines pinned tabs (up to 5 maximum)
  - Preserves existing posts and folders
  - No data loss
  
  **Replace Mode**:
  - Deletes all existing data
  - Replaces with imported data
  - Shows warning confirmation dialog
  - Cannot be undone

## User Interface

The settings modal now includes:

```
┌─────────────────────────────────────┐
│ ⚙️ Settings                         │
├─────────────────────────────────────┤
│ Sort By: [Name] [Date Modified] 🔄  │
│                                     │
│ Data:    [Export] [Import ▼]       │
│                     └─ Merge        │
│                     └─ Replace      │
└─────────────────────────────────────┘
```

## Technical Implementation

### Files Modified

1. **`extension/src/storage/storageManager.ts`**
   - Added `exportData()` method
   - Added `importData(jsonString, mode)` method

2. **`extension/src/storage/localStorageProvider.ts`**
   - Added `importPost(post)` method
   - Added `importFolder(folder)` method

3. **`shared/storage/types.ts`**
   - Extended `StorageProvider` interface with import methods

4. **`extension/src/popup/popup.tsx`**
   - Updated `SettingsModal` component with Export/Import UI
   - Added `handleExportData()` handler
   - Added `handleImportData(mode)` handler
   - Added dropdown for import mode selection

### Export Data Structure

```json
{
  "version": "1.0.0",
  "exportDate": "2025-11-28T19:30:00.000Z",
  "data": {
    "posts": [
      {
        "id": "uuid",
        "url": "https://example.com",
        "canonical_url": "https://example.com",
        "title": "Example",
        "tags": ["tag1", "tag2"],
        "notes": "Optional notes",
        "created_at": "2025-11-28T19:30:00.000Z",
        "updated_at": "2025-11-28T19:30:00.000Z",
        "favicon_url": "https://example.com/favicon.ico"
      }
    ],
    "folders": [
      {
        "id": "uuid",
        "name": "Work",
        "color": "#3B82F6",
        "post_ids": ["post-uuid-1", "post-uuid-2"],
        "created_at": "2025-11-28T19:30:00.000Z",
        "updated_at": "2025-11-28T19:30:00.000Z",
        "order": 1234567890
      }
    ],
    "pinnedTabs": ["post-uuid-1", "post-uuid-2"]
  }
}
```

## Testing Instructions

### Test Export
1. Open Recally extension popup
2. Add some test data:
   - Save a few tabs
   - Create a folder
   - Pin 2-3 tabs
3. Click the Settings button (⚙️ icon)
4. Click "Export" button
5. Verify:
   - File downloads with name `recally-backup-YYYY-MM-DD.json`
   - File contains all your data in JSON format
   - Success message appears

### Test Import - Merge Mode
1. Export your current data (for backup)
2. Add more test data to Recally
3. Click Settings → Import → Merge
4. Select the previously exported file
5. Confirm the merge action
6. Verify:
   - All original data is still present
   - Imported data was added
   - No duplicates created
   - Success message appears

### Test Import - Replace Mode
1. Export your current data (for backup)
2. Click Settings → Import → Replace
3. Select a different export file
4. See warning dialog about data deletion
5. Confirm the replace action
6. Verify:
   - All previous data is gone
   - Only imported data remains
   - Success message appears

### Test Error Handling
1. Try importing an invalid JSON file
2. Verify error message appears
3. Try importing a file with wrong format
4. Verify appropriate error message

## Error Handling

The implementation includes comprehensive error handling:

- **Invalid file format**: Shows error if JSON is malformed
- **Missing required fields**: Validates data structure before import
- **Pinned tabs limit**: Enforces maximum of 5 pinned tabs
- **Database errors**: Catches and displays database operation errors
- **User confirmations**: Requires confirmation for replace mode

## User Feedback

The feature provides clear feedback through:
- Success messages after export/import
- Warning dialogs for destructive actions (replace mode)
- Error messages for failed operations
- Loading states during operations

## Future Enhancements

Potential improvements for future versions:
1. Import from cloud storage (Google Drive, Dropbox)
2. Automatic periodic backups
3. Selective import (choose which data to import)
4. Export to different formats (CSV, HTML)
5. Import from browser bookmarks
6. Sync across devices

## Known Limitations

1. Import preserves original IDs (may cause issues if importing same data multiple times in merge mode)
2. No validation for duplicate data in merge mode
3. Large datasets may take time to import
4. No progress indicator for large imports

