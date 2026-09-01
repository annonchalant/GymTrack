// JWT token persistence for the web build — localStorage.
// (The mobile app used SecureStore on native; localStorage is the web
// equivalent used by its web build too.)

export async function getToken(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setToken(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function removeToken(key: string): Promise<void> {
  localStorage.removeItem(key);
}
