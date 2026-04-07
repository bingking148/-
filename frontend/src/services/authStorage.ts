export interface StoredAuthState<UserShape = unknown> {
  token: string;
  user: UserShape;
}

const AUTH_STORAGE_KEY = 'easyds.auth';

export function loadStoredAuthState<UserShape = unknown>(): StoredAuthState<UserShape> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuthState<UserShape>;
    if (!parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAuthState<UserShape = unknown>(state: StoredAuthState<UserShape>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function clearStoredAuthState() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredAuthToken(): string | null {
  return loadStoredAuthState()?.token || null;
}
