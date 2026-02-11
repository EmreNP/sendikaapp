/**
 * Firebase'in kendi email servisini kullanarak email gönderir
 * Firebase Auth REST API kullanır - harici servis gerektirmez
 */

/**
 * Error type guard
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Firebase Web API Key - Firebase Console'dan alın
// Firebase Console → Project Settings → General → Web API Key
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

if (!FIREBASE_WEB_API_KEY) {
  console.warn('⚠️ FIREBASE_WEB_API_KEY not set in environment variables.');
  console.warn('   Email sending will not work. Please add FIREBASE_WEB_API_KEY to your .env file.');
}

/**
 * Email verification sending is disabled project-wide.
 * These functions are kept as no-ops for compatibility.
 *
 * @param email Kullanıcının email adresi
 */
export async function sendEmailVerification(email: string): Promise<void> {
  console.log('Email verification disabled: sendEmailVerification called but no action taken.');
  return;
} 

async function signInWithPassword(email: string, password: string): Promise<{ idToken: string }> {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error('FIREBASE_WEB_API_KEY is not configured. Please add it to your .env file.');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Firebase signInWithPassword failed: ${error.error?.message || 'Unknown error'}`);
  }

  const data = (await response.json()) as { idToken?: string };
  if (!data.idToken) {
    throw new Error('Firebase signInWithPassword did not return an idToken');
  }

  return { idToken: data.idToken };
}

export async function sendEmailVerificationWithIdToken(idToken: string): Promise<void> {
  // Email verification via Firebase is disabled in this project.
  console.log('Email verification disabled: sendEmailVerificationWithIdToken called but no action taken.');
  return;
} 

export async function sendEmailVerificationWithEmailPassword(email: string, password: string): Promise<void> {
  // Email verification via Firebase is disabled in this project.
  console.log(`Email verification disabled: would have sent verification to ${email}, skipping.`);
  return;
}

/**
 * Firebase Auth REST API ile password reset email gönderir
 * Firebase'in kendi email servisini kullanır
 * 
 * @param email Kullanıcının email adresi
 * @throws Error if email sending fails
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error('FIREBASE_WEB_API_KEY is not configured. Please add it to your .env file.');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Firebase email sending failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log(`✅ Password reset email sent to ${email}`);
    return data;
  } catch (error: unknown) {
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Bilinmeyen hata';
    console.error(`❌ Failed to send password reset email to ${email}:`, errorMessage);
    throw error;
  }
}

