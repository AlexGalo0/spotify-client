const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

export async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

export { API_URL };
