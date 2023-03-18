import type { Context } from "../deps.ts";
import type { Handler, Handlers, Methods } from "../types.ts";
import { api } from "../helpers.ts";

export function paymentsMethods<C extends Context>(): Handlers<
  C,
  Methods<"payments">
> {
  const sendInvoice: Handler<C, "sendInvoice"> = () =>
    api.error("not_implemented");
  const createInvoiceLink: Handler<C, "createInvoiceLink"> = () =>
    api.error("not_implemented");
  const answerShippingQuery: Handler<C, "answerShippingQuery"> = () =>
    api.error("not_implemented");
  const answerPreCheckoutQuery: Handler<C, "answerPreCheckoutQuery"> = () =>
    api.error("not_implemented");

  return {
    sendInvoice,
    createInvoiceLink,
    answerShippingQuery,
    answerPreCheckoutQuery,
  };
}
