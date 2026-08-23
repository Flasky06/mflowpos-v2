import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateReceiptHtml = (sale: any) => {
  const shopName = sale.shop?.name || sale.business?.name || 'MFlow POS Retail';
  const shopPhone = sale.shop?.phone || sale.shop?.phoneNumber || '';
  const receiptNum = sale.receiptNumber || sale.id.substring(0, 8);
  const dateStr = new Date(sale.createdAt).toLocaleString();
  const customerName = sale.customer?.name || 'Walk-in Customer';
  const totalAmt = Number(sale.totalAmount || 0).toLocaleString();
  const paymentMethods = sale.payments
    ? sale.payments.map((p: any) => p.paymentMethod?.name || p.paymentMethod).join(', ')
    : sale.paymentMethod || 'CASH';

  const itemsHtml = (sale.items || [])
    .map((item: any) => {
      const name = item.product?.name || item.service?.name || item.name || 'Item';
      const qty = item.quantity || 1;
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const total = Number(item.totalPrice ?? (qty * unitPrice)).toLocaleString();
      return `
        <tr>
          <td style="padding: 4px 0; font-weight: bold;">${name}</td>
          <td style="padding: 4px 0; text-align: center;">${qty}</td>
          <td style="padding: 4px 0; text-align: right;">KES ${total}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            color: #000;
            font-size: 12px;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; }
          .total-row { font-size: 14px; font-weight: bold; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="center bold title">${shopName.toUpperCase()}</div>
        ${shopPhone ? `<div class="center">Tel: ${shopPhone}</div>` : ''}
        <div class="center bold">POS OFFICIAL RECEIPT</div>
        
        <div class="divider"></div>

        <div><b>Receipt #:</b> ${receiptNum}</div>
        <div><b>Date:</b> ${dateStr}</div>
        <div><b>Customer:</b> ${customerName}</div>
        <div><b>Payment:</b> ${paymentMethods}</div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between;" class="total-row">
          <span>TOTAL AMOUNT:</span>
          <span>KES ${totalAmt}</span>
        </div>

        <div class="divider"></div>
        <div class="center" style="margin-top: 10px;">Thank you for your business!</div>
        <div class="center" style="font-size: 10px; margin-top: 4px;">Powered by MFlow POS v2.0</div>
      </body>
    </html>
  `;
};

// Print directly to connected Thermal/AirPrint/Bluetooth printers
export const printThermalReceipt = async (sale: any) => {
  try {
    const html = generateReceiptHtml(sale);
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Error printing thermal receipt:', error);
    throw error;
  }
};

// Generate PDF & Share via WhatsApp, Email, or Save to files
export const shareReceiptPdf = async (sale: any) => {
  try {
    const html = generateReceiptHtml(sale);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Receipt #${sale.receiptNumber}`,
      });
    }
  } catch (error) {
    console.error('Error sharing receipt PDF:', error);
    throw error;
  }
};
