import { Types } from "./deps.ts";

function result<T>(result: T): Promise<Types.ApiSuccess<T>> {
  return Promise.resolve({ ok: true, result });
}

const ERRORS = {
  chat_not_found: [404, "Chat not found"],
  its_a_channel: [400, "Chat is a channel"],
  not_implemented: [501, "Not Implemented"],
} as const;

function error(
  error: keyof typeof ERRORS,
  message = "",
  parameters?: Types.ResponseParameters,
): Types.ApiError {
  const err = ERRORS[error];
  return {
    ok: false,
    error_code: err[0],
    description: `${err[1]}${message ? `: ${message}` : ""}`,
    ...(parameters ? { parameters } : {}),
  };
}

export const api = { result, error };

// Collection of functions for generating real-looking random values for using
// in Telegram API requests and responses.
export const rand = {
  botId: () => randomNumberInBetween(1000000000, 9999999999),
};

function randomNumberInBetween(start: number, end: number) {
  return Math.floor(start + Math.random() * end);
}

// Returns current time in Telegram's format.
export function date() {
  return Math.trunc(Date.now() / 1000);
}
