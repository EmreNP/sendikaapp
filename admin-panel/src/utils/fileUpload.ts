import { apiRequest } from '@/utils/api';

/**
 * Upload PDF to backend endpoint. Backend uses Admin SDK to store the file.
 */
export async function uploadUserRegistrationForm(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Validate file
  if (file.type !== 'application/pdf') {
    throw new Error('Sadece PDF dosyası yüklenebilir');
  }
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error('Dosya boyutu 10MB\'dan küçük olmalıdır');
  }

  // Read file as base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const b64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      resolve(b64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // Send to backend
  const body = {
    fileName: `${userId}_${Date.now()}.pdf`,
    contentType: 'application/pdf',
    base64,
  };

  const response = await apiRequest(`/api/users/${userId}/upload-registration-form`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response.documentUrl;
}
