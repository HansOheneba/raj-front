import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatLocationLine } from "@/lib/customer/locations";
import { siteConfig } from "@/lib/config";
import { formatDeliveryDate, formatOrderPlacedAt, orderStatusLabel } from "./format";
import type { Order } from "./types";

const LOGO_PATH = "/logos/raj-logo.png";

const brand = {
  clay: [181, 101, 29],
  clayDark: [150, 82, 15],
  claySoft: [243, 230, 216],
  cream: [255, 252, 247],
  ink: [31, 27, 24],
  inkMuted: [95, 86, 78],
  line: [234, 229, 221],
} satisfies Record<string, [number, number, number]>;

const margin = 18;

const invoiceAmountFormatter = new Intl.NumberFormat(siteConfig.locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatInvoicePrice(amount: number): string {
  return `GHS ${invoiceAmountFormatter.format(amount)}`;
}

let logoDataUrl: string | null = null;

async function getLogoDataUrl(): Promise<string> {
  if (logoDataUrl) return logoDataUrl;

  const response = await fetch(LOGO_PATH);
  if (!response.ok) {
    throw new Error("Could not load invoice logo.");
  }

  const blob = await response.blob();
  logoDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read invoice logo."));
    reader.readAsDataURL(blob);
  });

  return logoDataUrl;
}

function formatShipping(amount: number): string {
  return amount === 0 ? "Free" : formatInvoicePrice(amount);
}

function lineItemLabel(name: string, attributes: Record<string, string>): string {
  const details = Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");

  return details ? `${name}\n${details}` : name;
}

function drawSectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...brand.inkMuted);
  doc.text(label.toUpperCase(), x, y);
}

function drawSectionValue(doc: jsPDF, lines: string[], x: number, y: number, maxWidth: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...brand.ink);
  doc.text(lines, x, y, { maxWidth });
}

export async function downloadInvoice(order: Order, customerName: string): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const logo = await getLogoDataUrl();

  doc.setFillColor(...brand.cream);
  doc.rect(0, 0, pageWidth, 44, "F");

  doc.addImage(logo, "PNG", margin, 11, 20, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...brand.ink);
  doc.text(siteConfig.name, pageWidth - margin, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...brand.inkMuted);
  doc.text(siteConfig.tagline, pageWidth - margin, 21, { align: "right" });
  doc.text(siteConfig.contact.email, pageWidth - margin, 27, { align: "right" });
  doc.text(siteConfig.contact.phone, pageWidth - margin, 32, { align: "right" });

  doc.setDrawColor(...brand.clay);
  doc.setLineWidth(0.6);
  doc.line(margin, 44, pageWidth - margin, 44);

  let y = 56;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...brand.clay);
  doc.text("Invoice", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...brand.inkMuted);
  doc.text(`Order #${order.id}`, pageWidth - margin, y - 4, { align: "right" });
  if (order.trackingNumber) {
    doc.text(order.trackingNumber, pageWidth - margin, y + 1.5, { align: "right" });
  }

  y += 14;
  const metaColumnWidth = contentWidth / 2 - 4;

  drawSectionLabel(doc, "Order date", margin, y);
  drawSectionValue(doc, [formatOrderPlacedAt(order.placedAt)], margin, y + 5, metaColumnWidth);

  drawSectionLabel(doc, "Status", margin + contentWidth / 2, y);
  drawSectionValue(
    doc,
    [orderStatusLabel[order.status]],
    margin + contentWidth / 2,
    y + 5,
    metaColumnWidth,
  );

  y += 18;
  drawSectionLabel(doc, "Delivery date", margin, y);
  drawSectionValue(doc, [formatDeliveryDate(order.deliveryDate)], margin, y + 5, metaColumnWidth);

  drawSectionLabel(doc, "Customer", margin + contentWidth / 2, y);
  drawSectionValue(doc, [customerName], margin + contentWidth / 2, y + 5, metaColumnWidth);

  y += 18;
  const deliveryAddress = formatLocationLine({
    line: order.address.line,
    city: order.address.city,
    region: order.address.region,
  });

  drawSectionLabel(doc, "Deliver to", margin, y);
  const deliverToLines = [order.address.name, deliveryAddress];
  drawSectionValue(doc, deliverToLines, margin, y + 5, contentWidth);

  const deliverToHeight = doc.splitTextToSize(deliverToLines.join("\n"), contentWidth).length;
  y += 5 + deliverToHeight * 4.5 + 10;

  const qtyColumnWidth = 14;
  const priceColumnWidth = 36;
  const totalColumnWidth = 36;
  const itemColumnWidth =
    contentWidth - qtyColumnWidth - priceColumnWidth - totalColumnWidth;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    head: [["Item", "Qty", "Price", "Total"]],
    body: order.lines.map((line) => [
      lineItemLabel(line.name, line.attributes),
      String(line.quantity),
      formatInvoicePrice(line.unitPrice),
      formatInvoicePrice(line.unitPrice * line.quantity),
    ]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: brand.ink,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      lineColor: brand.line,
      lineWidth: 0.1,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: brand.claySoft,
      textColor: brand.ink,
      fontStyle: "bold",
      lineWidth: 0,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: itemColumnWidth },
      1: { cellWidth: qtyColumnWidth, halign: "center" },
      2: { cellWidth: priceColumnWidth, halign: "right" },
      3: { cellWidth: totalColumnWidth, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: brand.cream,
    },
  });

  const tableEnd = doc.lastAutoTable.finalY + 10;
  const totalsX = pageWidth - margin;
  const labelX = totalsX - 52;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...brand.inkMuted);
  doc.text("Subtotal", labelX, tableEnd, { align: "right" });
  doc.text("Shipping", labelX, tableEnd + 6, { align: "right" });
  doc.text("Total", labelX, tableEnd + 14, { align: "right" });

  doc.setTextColor(...brand.ink);
  doc.text(formatInvoicePrice(order.subtotal), totalsX, tableEnd, { align: "right" });
  doc.text(formatShipping(order.shipping), totalsX, tableEnd + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...brand.clayDark);
  doc.text(formatInvoicePrice(order.total), totalsX, tableEnd + 14, { align: "right" });

  const footerY = pageHeight - 14;
  doc.setDrawColor(...brand.line);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...brand.inkMuted);
  doc.text("Thank you for shopping with us.", margin, footerY);
  doc.text(siteConfig.url.replace(/^https?:\/\//, ""), pageWidth - margin, footerY, {
    align: "right",
  });

  doc.save(`invoice-${order.trackingNumber ?? order.id}.pdf`);
}
