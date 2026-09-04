import { isApiEnabled } from "@/lib/api";
import { httpCreateOrder } from "./http";
import { mockCreateOrder } from "./mock";

export type {
  CheckoutCustomer,
  CheckoutLine,
  CreateOrderInput,
  CreateOrderResult,
} from "./types";

const createOrderImpl = isApiEnabled ? httpCreateOrder : mockCreateOrder;

export const createOrder = createOrderImpl;
