/**
 * Utility function to get HTTP status text.
 * @param status - HTTP status code
 * @returns The corresponding status text
 */
export const getStatusText = (status: number): string => {
    const statusTexts: Record<number, string> = {
      200: "OK",
      201: "Created",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
    };
    return statusTexts[status] || "Unknown Status";
};
