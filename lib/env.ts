export function getRequiredServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || "healthycorgi_session";
}

export function getAdminCode() {
  return process.env.ADMIN_CODE || "corgiadmin";
}
