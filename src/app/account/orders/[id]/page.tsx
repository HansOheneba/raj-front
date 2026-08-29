import type { Metadata } from "next";
import { OrderDetailView } from "@/components/account/OrderDetailView";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id}`,
    description: "Your order details.",
  };
}

export default async function AccountOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
