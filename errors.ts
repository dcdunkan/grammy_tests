import { Types } from "./deps.ts";

const ERRORS = {
  CHAT_NOT_FOUND: [404, "CHAT NOT FOUND"],
  NOT_FOUND: [404, "NOT FOUND"],
  BOT_IS_NOT_AN_ADMINISTRATOR: [403, "BOT IS NOT AN ADMINISTRATOR"],
  BAD_REQUEST: [400, "Bad request"],
  INVALID_METHOD: [403, "Invalid method"],
} as const;

export function apiError(
  error: keyof typeof ERRORS,
  message?: string,
): Types.ApiError {
  return {
    ok: false,
    error_code: ERRORS[error][0],
    description: ERRORS[error][1] + (message ? `: ${message}` : ""),
  };
}
