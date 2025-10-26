import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import PrintableReceipt from '../../components/PrintableReceipt';
import { Receipt, Search } from 'lucide-react';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [receiptPaymentMethod, setReceiptPaymentMethod] = useState('Cash');

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales', { params: { page, limit } });
      const payload = res?.data?.data ? res.data : { data: res?.data?.data || [], total: res?.data?.total || 0 };
      setSales(payload.data || []);
      setTotal(payload.total || 0);
    } catch (err) {
      console.error('Failed to load sales', err);
      toast.error(err?.response?.data?.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const openReceiptForSaleId = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/sales/${id}`);
      const sale = res?.data?.data || res?.data;
      if (!sale) throw new Error('Sale detail not found');

      setReceiptSale(sale);
      setReceiptPaymentMethod('Cash');
      setShowReceipt(true);
    } catch (err) {
      console.error('Failed to open receipt', err);
      toast.error(err?.response?.data?.message || 'Failed to open receipt');
    } finally {
      setLoading(false);
    }
  };

  const filtered = query
    ? sales.filter((s) => String(s._id || s.id).toLowerCase().includes(query.toLowerCase()))
    : sales;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sales History</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              className="ml-2 outline-none text-sm"
              placeholder="Search by Transaction ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2">Transaction</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Cashier</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={String(sale._id || sale.id)} className="border-t">
                  <td className="px-4 py-2 font-mono">{String(sale._id || sale.id).slice(-6)}</td>
                  <td className="px-4 py-2">{format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm')}</td>
                  <td className="px-4 py-2">{sale.cashierName}</td>
                  <td className="px-4 py-2">{(sale.productsSold || []).reduce((sum, i) => sum + (i.quantity || 0), 0)}</td>
                  <td className="px-4 py-2">₦{(sale.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openReceiptForSaleId(String(sale._id || sale.id))}
                    >
                      <Receipt className="h-4 w-4 mr-1" /> Print
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    {loading ? 'Loading…' : 'No sales found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows:</label>
            <select className="border rounded px-2 py-1" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>

      {showReceipt && receiptSale && (
        <PrintableReceipt
          sale={receiptSale}
          paymentMethod={receiptPaymentMethod}
          customer={null}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default SalesHistory;