// File System Access API utilities for Google Drive integration
// This allows reading/writing to a local folder that can be synced to Google Drive

export interface FileSystemState {
  directoryHandle: FileSystemDirectoryHandle | null;
  isSupported: boolean;
  isConnected: boolean;
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

// Request access to a directory
export const requestDirectoryAccess = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API is not supported in this browser');
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });
    return handle;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled
      return null;
    }
    console.error('Error requesting directory access:', error);
    throw error;
  }
};

// Verify we still have permission to access the directory
export const verifyPermission = async (
  handle: FileSystemDirectoryHandle,
  readWrite = true
): Promise<boolean> => {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: readWrite ? 'readwrite' : 'read',
  };

  // Check if we already have permission
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Request permission
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
};

// Read a JSON file from the directory
export const readJsonFile = async <T>(
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<T | null> => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      return null;
    }
    console.error(`Error reading file ${filename}:`, error);
    throw error;
  }
};

// Write a JSON file to the directory
export const writeJsonFile = async (
  directoryHandle: FileSystemDirectoryHandle,
  filename: string,
  data: unknown
): Promise<void> => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  } catch (error) {
    console.error(`Error writing file ${filename}:`, error);
    throw error;
  }
};

// List files in the directory
export const listFiles = async (
  directoryHandle: FileSystemDirectoryHandle
): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'file') {
      files.push(entry.name);
    }
  }
  return files;
};

// Delete a file from the directory
export const deleteFile = async (
  directoryHandle: FileSystemDirectoryHandle,
  filename: string
): Promise<boolean> => {
  try {
    await directoryHandle.removeEntry(filename);
    return true;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      return false;
    }
    console.error(`Error deleting file ${filename}:`, error);
    throw error;
  }
};

// Create a subdirectory
export const createSubdirectory = async (
  directoryHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> => {
  return await directoryHandle.getDirectoryHandle(name, { create: true });
};

// Data file names
export const DATA_FILES = {
  projects: 'bflow_projects.json',
  episodes: 'bflow_episodes.json',
  tasks: 'bflow_tasks.json',
  teamMembers: 'bflow_team.json',
  calendarEvents: 'bflow_calendar.json',
  config: 'bflow_config.json',
} as const;
