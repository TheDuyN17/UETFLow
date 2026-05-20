const KEYS = {
  token: "auth_token",
  user: "auth_user",
  roles: "auth_roles",
};

export function setAuth({ token, email, roles, profile }) {
  if (token) localStorage.setItem(KEYS.token, token);
  if (roles) localStorage.setItem(KEYS.roles, JSON.stringify(roles));
  const user = profile ? { ...profile, email: email ?? profile.email } : { email };
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function getAuth() {
  try {
    return {
      token: localStorage.getItem(KEYS.token),
      user: JSON.parse(localStorage.getItem(KEYS.user) || "null"),
      roles: JSON.parse(localStorage.getItem(KEYS.roles) || "[]"),
    };
  } catch {
    return { token: null, user: null, roles: [] };
  }
}

export function clearAuth() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(KEYS.token));
}

// roles là mảng số nguyên: [-1, 1, 2, 3, 4, 5]
export function hasRole(roleId) {
  try {
    const roles = JSON.parse(localStorage.getItem(KEYS.roles) || "[]");
    return roles.includes(Number(roleId));
  } catch {
    return false;
  }
}
