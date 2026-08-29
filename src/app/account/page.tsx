import type { Metadata } from "next";
import { OrdersView } from "@/components/account/OrdersView";

export const metadata: Metadata = {
  title: "My orders",
  description: "See what you have ordered and where it is.",
};

export default function AccountOrdersPage() {
  return <OrdersView />;
}
