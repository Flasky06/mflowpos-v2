export function generateThermalReceipt(sale: any): string {
  if (!sale) return '';

  // If sale already has thermalReceiptPayload from backend, return it
  if (typeof sale === 'string' && sale.includes('================================')) {
    return sale;
  }

  const lines: string[] = [];
  lines.push('================================');
  lines.push('          RECEIPT               ');
  lines.push('================================');
  if (sale.shop?.name) lines.push(`Branch   : ${sale.shop.name}`);
  lines.push(`Receipt #: ${sale.receiptNumber || sale.id || 'N/A'}`);
  lines.push(`Date     : ${new Date(sale.createdAt || Date.now()).toLocaleString()}`);
  lines.push(`Cashier  : ${sale.user?.fullName || sale.user?.name || 'Staff'}`);
  if (sale.customer?.name) lines.push(`Customer : ${sale.customer.name}`);
  if (sale.serviceOrderStatus) lines.push(`Job Status: ${sale.serviceOrderStatus}`);
  lines.push('--------------------------------');
  lines.push('Item              Qty     Total ');
  lines.push('--------------------------------');

  const items = sale.items || [];
  if (items.length > 0) {
    for (const item of items) {
      const itemName = item.product?.name || item.service?.name || item.name || 'Item';
      const name = itemName.padEnd(16, ' ').slice(0, 16);
      const qty = (item.quantity || 1).toString().padStart(3, ' ');
      const totalVal = Number(item.totalPrice ?? item.price ?? 0);
      const total = `KSh ${totalVal.toLocaleString()}`.padStart(11, ' ');
      lines.push(`${name} ${qty} ${total}`);
    }
  } else {
    lines.push('Standard Transaction Record');
  }

  lines.push('--------------------------------');
  lines.push(`TOTAL AMOUNT  : KSh ${Number(sale.totalAmount || 0).toLocaleString()}`);
  if (sale.paidAmount !== undefined && sale.paidAmount !== null) {
    lines.push(`PAID AMOUNT   : KSh ${Number(sale.paidAmount).toLocaleString()}`);
  }

  const paymentMethods = sale.payments
    ? sale.payments.map((p: any) => p.paymentMethod?.name || p.paymentMethod || 'Cash').join(', ')
    : sale.paymentMethod || 'Cash';
  if (paymentMethods) {
    lines.push(`PAYMENT MODE  : ${paymentMethods}`);
  }

  lines.push('--------------------------------');
  lines.push('Thank you for your business!');
  lines.push('================================\n');

  return lines.join('\n');
}
