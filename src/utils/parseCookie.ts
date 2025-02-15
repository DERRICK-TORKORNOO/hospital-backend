// Utility to parse cookies from the Cookie header
export const parseCookies = (cookieHeader: string): Record<string, string> => {
    return cookieHeader
      .split(";")
      .map(cookie => cookie.trim().split("="))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: decodeURIComponent(value || "") }), {});
  };