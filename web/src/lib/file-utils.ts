import { toast } from '@/components/ui/use-toast';
import { ApiError } from './api-utils';

// Common file types and their MIME types
export const FILE_TYPES = {
  IMAGE: {
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
  },
  DOCUMENT: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
  },
  AUDIO: {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/midi': ['.midi', '.mid'],
  },
  VIDEO: {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogv'],
  },
  ARCHIVE: {
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/x-tar': ['.tar'],
    'application/x-gzip': ['.gz'],
  },
} as const;

// Maximum file sizes in bytes
const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  ARCHIVE: 100 * 1024 * 1024, // 100MB
} as const;

type FileCategory = keyof typeof FILE_TYPES;
type MimeType = keyof typeof FILE_TYPES[FileCategory];

/**
 * Gets the file extension from a filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Gets the MIME type from a file extension
 */
export function getMimeTypeFromExtension(extension: string): MimeType | null {
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  
  for (const category of Object.keys(FILE_TYPES) as FileCategory[]) {
    for (const [mime, exts] of Object.entries(FILE_TYPES[category])) {
      if ((exts as string[]).includes(ext)) {
        return mime as MimeType;
      }
    }
  }
  
  return null;
}

/**
 * Gets the file category from a MIME type
 */
export function getFileCategoryFromMimeType(mimeType: string): FileCategory | null {
  for (const category of Object.keys(FILE_TYPES) as FileCategory[]) {
    if (mimeType in FILE_TYPES[category]) {
      return category;
    }
  }
  
  return null;
}

/**
 * Validates a file against allowed types and size
 */
export function validateFile(
  file: File,
  allowedCategories: FileCategory[] = ['IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'ARCHIVE'],
  maxSize?: number
): { valid: boolean; error?: string } {
  // Check if file type is allowed
  const fileCategory = getFileCategoryFromMimeType(file.type);
  
  if (!fileCategory || !allowedCategories.includes(fileCategory)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedCategories.join(', ')}`,
    };
  }
  
  // Check file size
  const maxAllowedSize = maxSize || MAX_FILE_SIZES[fileCategory];
  
  if (file.size > maxAllowedSize) {
    const maxSizeMB = (maxAllowedSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large. Maximum size: ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Converts a file to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove the data URL prefix
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 string to a Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Creates a blob URL for a file or base64 string
 */
export function createBlobUrl(
  file: File | string,
  mimeType?: string
): string {
  if (typeof file === 'string') {
    if (!mimeType) {
      throw new Error('MIME type is required when providing a base64 string');
    }
    
    const blob = base64ToBlob(file, mimeType);
    return URL.createObjectURL(blob);
  }
  
  return URL.createObjectURL(file);
}

/**
 * Revokes a blob URL to free up memory
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Handles file upload to the server
 */
export async function uploadFile(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const xhr = new XMLHttpRequest();
    
    // Set up progress tracking
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    // Set up the request
    xhr.open('POST', uploadUrl, true);
    
    // Set authorization header if user is logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    // Handle response
    const response = await new Promise<{ url: string; key: string }>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during file upload'));
      };
      
      xhr.send(formData);
    });
    
    return response;
  } catch (error) {
    console.error('Error uploading file:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError({
      message: error instanceof Error ? error.message : 'Failed to upload file',
      status: 500,
    });
  }
}

/**
 * Handles multiple file uploads with progress tracking
 */
export async function uploadFiles(
  files: File[],
  uploadUrl: string,
  onProgress?: (progress: number, file: File, index: number) => void
): Promise<Array<{ url: string; key: string; file: File }>> {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await uploadFile(
        file,
        uploadUrl,
        (progress) => onProgress?.(progress, file, i)
      );
      
      results.push({
        ...result,
        file,
      });
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      
      // Re-throw the error to stop further processing if needed
      throw error;
    }
  }
  
  return results;
}

/**
 * Gets the appropriate icon for a file type
 */
export function getFileIcon(mimeType: string): string {
  const category = getFileCategoryFromMimeType(mimeType);
  
  switch (category) {
    case 'IMAGE':
      return 'image';
    case 'AUDIO':
      return 'music';
    case 'VIDEO':
      return 'video';
    case 'DOCUMENT':
      if (mimeType.includes('pdf')) return 'file-text';
      if (mimeType.includes('word')) return 'file-text';
      if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'table';
      if (mimeType.includes('text/plain')) return 'file-text';
      return 'file';
    case 'ARCHIVE':
      return 'archive';
    default:
      return 'file';
  }
}

/**
 * Formats file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Creates a download link for a file
 */
export function downloadFile(
  data: string | Blob | File,
  filename: string,
  mimeType?: string
): void {
  let blob: Blob;
  
  if (typeof data === 'string') {
    if (!mimeType) {
      throw new Error('MIME type is required when providing a base64 string');
    }
    
    blob = base64ToBlob(data, mimeType);
  } else if (data && typeof data === 'object' && data instanceof Blob) {
    blob = data;
  } else {
    throw new Error('Invalid data type. Expected string, Blob, or File.');
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

/**
 * Takes a screenshot of an HTML element
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: {
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string;
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
  } = {}
): Promise<Blob> {
  const {
    width = element.offsetWidth,
    height = element.offsetHeight,
    scale = window.devicePixelRatio || 1,
    backgroundColor = '#ffffff',
    type = 'image/png',
    quality = 0.92,
  } = options;
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  // Set canvas dimensions
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Apply scaling
  context.scale(scale, scale);
  
  // Set background color
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);
  
  // Use html2canvas for more reliable rendering
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvasElement = await html2canvas(element, {
      scale,
      backgroundColor,
      width,
      height,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvasElement.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Failed to create blob from canvas');
          }
          resolve(blob);
        },
        type,
        quality
      );
    });
  } catch (error) {
    console.error('Error using html2canvas:', error);
    throw new Error('Screenshot capture failed. html2canvas is required for this feature.');
  }
}
