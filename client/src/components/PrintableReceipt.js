import React from 'react';
import { format } from 'date-fns';

const PrintableReceipt = ({ sale, paymentMethod = 'cash', customer = null, onClose }) => {
  if (!sale) return null;

  const createdAt = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const transactionId = sale._id ? String(sale._id).slice(-8).toUpperCase() : 'N/A';
  const items = sale.productsSold || [];
  const total = sale.totalAmount || items.reduce((sum, i) => sum + (i.totalPrice || (i.unitPrice * i.quantity)), 0);
  const cashierName = sale.cashierName || 'Cashier';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Receipt Preview</h3>
          <button onClick={onClose} className="no-print text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Printable area */}
        <div className="receipt-print-area p-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold">DanAlhaji Supermarket</h2>
            <p className="text-xs text-gray-600">POS Receipt</p>
          </div>

          <div className="mt-2 text-xs">
            <div className="flex justify-between"><span>Date:</span><span>{format(createdAt, 'MMM dd, yyyy HH:mm')}</span></div>
            <div className="flex justify-between"><span>Transaction:</span><span>#{transactionId}</span></div>
            <div className="flex justify-between"><span>Cashier:</span><span>{cashierName}</span></div>
            {customer && (
              <div className="flex justify-between"><span>Customer:</span><span>{customer.name}</span></div>
            )}
            <div className="flex justify-between"><span>Payment:</span><span>{paymentMethod === 'credit' ? 'Credit' : 'Cash'}</span></div>
          </div>

          {/* Items */}
          <div className="mt-3 border-t border-dashed pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Item</span>
              <span>Qty x Price</span>
              <span>Total</span>
            </div>
            <div className="mt-1 space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate mr-2">{item.productName}</span>
                  <span>{item.quantity} x ₦{(item.unitPrice).toFixed(2)}</span>
                  <span className="font-medium">₦{(item.totalPrice || (item.unitPrice * item.quantity)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-3 border-t border-dashed pt-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">TOTAL</span>
              <span className="font-bold">₦{Number(total).toFixed(2)}</span>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Thank you for your purchase!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print px-4 py-3 border-t border-gray-200 flex gap-2 justify-end">
          <button onClick={handlePrint} className="btn btn-primary">Print</button>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;