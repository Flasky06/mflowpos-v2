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
      const total = `KES ${totalVal.toLocaleString()}`.padStart(11, ' ');
      lines.push(`${name} ${qty} ${total}`);
    }
  } else {
    lines.push('Standard Transaction Record');
  }

  lines.push('--------------------------------');
  lines.push(`TOTAL AMOUNT  : KES ${Number(sale.totalAmount || 0).toLocaleString()}`);
  if (sale.paidAmount !== undefined && sale.paidAmount !== null) {
    lines.push(`PAID AMOUNT   : KES ${Number(sale.paidAmount).toLocaleString()}`);
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

export function generateThermalQuotation(q: any): string {
  if (!q) return '';

  const lines: string[] = [];
  lines.push('================================');
  lines.push('       QUOTATION / INVOICE      ');
  lines.push('================================');
  if (q.shop?.name) lines.push(`Branch    : ${q.shop.name}`);
  lines.push(`Quote #   : ${q.quotationNumber || q.id || 'N/A'}`);
  lines.push(`Date      : ${new Date(q.createdAt || Date.now()).toLocaleDateString()}`);
  lines.push(`Customer  : ${q.customer?.name || 'Prospect Customer'}`);
  lines.push(`Status    : ${q.status || 'DRAFT'}`);
  lines.push('--------------------------------');
  lines.push('Item              Qty     Total ');
  lines.push('--------------------------------');

  const items = q.items || [];
  if (items.length > 0) {
    for (const item of items) {
      const itemName = item.product?.name || item.service?.name || item.name || 'Item';
      const name = itemName.padEnd(16, ' ').slice(0, 16);
      const qty = (item.quantity || 1).toString().padStart(3, ' ');
      const totalVal = Number(item.totalPrice ?? item.price ?? 0);
      const total = `KES ${totalVal.toLocaleString()}`.padStart(11, ' ');
      lines.push(`${name} ${qty} ${total}`);
    }
  } else {
    lines.push('Quotation Line Items');
  }

  lines.push('--------------------------------');
  lines.push(`TOTAL ESTIMATE : KES ${Number(q.totalAmount || 0).toLocaleString()}`);
  lines.push('--------------------------------');
  lines.push('Valid for 30 Days');
  lines.push('Thank you for choosing us!');
  lines.push('================================\n');

  return lines.join('\n');
}
