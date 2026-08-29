import { httpCreateOrder } from "./http";
import { mockCreateOrder } from "./mock";

export type {
  CheckoutCustomer,
  CheckoutLine,
  CreateOrderInput,
  CreateOrderResult,
} from "./types";

const createOrderImpl = process.env.NEXT_PUBLIC_API_URL ? httpCreateOrder : mockCreateOrder;

export const createOrder = createOrderImpl;
