export const createErrorResponse = (message: string, errors?: any[]) => ({
  error: true,
  message,
  ...(errors && { errors })
});