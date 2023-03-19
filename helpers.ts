import { Types } from "./deps.ts";
import { ERRORS } from "./errors.ts";

/** API related properties */
export const api = {
  /** Current Bot API version */
  BOT_API_VERSION: "6.6",
  /** Return API result */
  result<T>( // extends Awaited<ReturnType<RawApi[keyof RawApi]>>
    result: T,
  ): Promise<Types.ApiSuccess<T>> {
    return Promise.resolve({ ok: true, result });
  },
  /** Return API error */
  error(
    error: keyof typeof ERRORS,
    message = "",
    parameters?: Types.ResponseParameters,
  ): Promise<Types.ApiError> {
    const err = ERRORS[error];
    return Promise.resolve({
      ok: false,
      error_code: err[0],
      description: `${err[1]}${message ? `: ${message}` : ""}`,
      ...(parameters ? { parameters } : {}),
    });
  },
};

/**
 * Collection of functions for generating real-looking random
 * values for using in Telegram API requests and responses.
 */
export const rand = {
  botId: () => randomNumberInBetween(1000000000, 9999999999),
};

function randomNumberInBetween(start: number, end: number) {
  return Math.floor(start + Math.random() * end);
}

/** Returns current time in Telegram's format. */
export function date() {
  return Math.trunc(Date.now() / 1000);
}
