import React, { useState, useEffect } from 'react';
import { paymentsApi } from '../api/services';
import type { Payment } from '../types';
import { CheckCircle2 } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [txnSearch, setTxnSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.list({
        txn_ref_no: txnSearch ? txnSearch : undefined
      });
      setPayments(data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [txnSearch]);

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search by Transaction Reference Number (e.g. TXN_TEST_REF_9999)..."
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading financial transaction log...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Fine ID</th>
                <th>Payment Amount</th>
                <th>Payment Date</th>
                <th>Payment Method</th>
                <th>Txn Ref Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td>#{p.payment_id}</td>
                    <td>#Fine-{p.fine_id}</td>
                    <td><strong style={{ color: 'var(--accent-emerald)' }}>₹{p.payment_amount}</strong></td>
                    <td>{new Date(p.payment_date).toLocaleString()}</td>
                    <td><span className="badge badge-info">{p.payment_method}</span></td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{p.txn_ref_no}</strong></td>
                    <td>
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                        <CheckCircle2 size={12} /> {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="state-center">No payment transaction records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
