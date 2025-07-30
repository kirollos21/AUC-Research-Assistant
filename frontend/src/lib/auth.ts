export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// Get stored users from localStorage
export const getStoredUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
};

// Save new user to localStorage
export const saveUser = (user: User): boolean => {
  try {
    const users = getStoredUsers();

    // Check if user already exists
    const existingUser = users.find((u) => u.email === user.email);
    if (existingUser) {
      return false; // User already exists
    }

    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
};

// Authenticate user
export const authenticateUser = (
  email: string,
  password: string,
): User | null => {
  const users = getStoredUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  return user || null;
};

// Get current auth state
export const getAuthState = (): AuthState => {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null };
  }

  const authData = localStorage.getItem("auth");
  return authData
    ? JSON.parse(authData)
    : { isAuthenticated: false, user: null };
};

// Set auth state
export const setAuthState = (authState: AuthState): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth", JSON.stringify(authState));
};

// Login user
export const loginUser = (user: User): void => {
  setAuthState({ isAuthenticated: true, user });
};

// Logout user
export const logoutUser = (): void => {
  setAuthState({ isAuthenticated: false, user: null });
};
