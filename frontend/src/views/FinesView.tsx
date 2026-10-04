import React, { useState, useEffect } from 'react';
import { finesApi, paymentsApi } from '../api/services';
import type { Fine } from '../types';
import { CreditCard, X, CheckCircle2 } from 'lucide-react';

export const FinesView: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNPAID' | 'PAID' | 'WAIVED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  // Payment form states
  const [payAmount, setPayAmount] = useState<number>(1500);
  const [payMethod, setPayMethod] = useState('UPI');
  const [txnRef, setTxnRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFines = async () => {
    setLoading(true);
    try {
      const data = await finesApi.list({
        status: activeTab !== 'ALL' ? activeTab : undefined
      });
      setFines(data);
    } catch (err) {
      console.error('Error fetching fines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [activeTab]);

  const handleOpenPay = (fine: Fine) => {
    setSelectedFine(fine);
    setPayAmount(fine.total_amount);
    setTxnRef(`TXN_${Date.now()}`);
    setErrorMsg('');
    setSuccessMsg('');
    setShowPayModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await paymentsApi.process({
        fine_id: selectedFine.fine_id,
        payment_amount: payAmount,
        payment_method: payMethod,
        txn_ref_no: txnRef
      });
      setSuccessMsg('Payment transaction processed successfully (ACID Committed)!');
      setTimeout(() => {
        setShowPayModal(false);
        fetchFines();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Payment transaction failed.');
    }
  };

  return (
    <div>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('ALL')}>All Fines</button>
            <button className={`btn ${activeTab === 'UNPAID' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('UNPAID')}>Unpaid Fines</button>
            <button className={`btn ${activeTab === 'PAID' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('PAID')}>Paid Fines</button>
            <button className={`btn ${activeTab === 'WAIVED' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('WAIVED')}>Waived Fines</button>
          </div>
        </div>

        {loading ? (
          <div className="state-center">
            <div className="spinner" />
            <p>Loading fine ledgers...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fine ID</th>
                <th>Violation ID</th>
                <th>Base Amount</th>
                <th>Penalty Amount</th>
                <th>Total Amount</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fines.length > 0 ? (
                fines.map((f) => (
                  <tr key={f.fine_id}>
                    <td>#{f.fine_id}</td>
                    <td>#Violation-{f.violation_id}</td>
                    <td>₹{f.base_amount}</td>
                    <td>₹{f.penalty_amount || '0.00'}</td>
                    <td><strong style={{ color: 'var(--accent-cyan)' }}>₹{f.total_amount}</strong></td>
                    <td>{f.issue_date}</td>
                    <td>{f.due_date}</td>
                    <td>
                      <span className={`badge ${f.status === 'PAID' ? 'badge-success' : f.status === 'WAIVED' ? 'badge-warning' : 'badge-danger'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      {f.status === 'UNPAID' || f.status === 'OVERDUE' ? (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleOpenPay(f)}>
                          <CreditCard size={14} /> Pay Fine
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="state-center">No fine ledger records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showPayModal && selectedFine && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Process Fine Payment (ACID Transaction)</h3>
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleProcessPayment} className="modal-body">
              {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              {successMsg && <div style={{ color: 'var(--accent-emerald)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} />{successMsg}</div>}
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <div>Fine ID: <strong>#{selectedFine.fine_id}</strong> (Violation #{selectedFine.violation_id})</div>
                <div>Required Amount: <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>₹{selectedFine.total_amount}</strong></div>
                <div>Due Date: <span>{selectedFine.due_date}</span></div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input type="number" className="form-control" required value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-control" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CASH_COUNTER">Cash Counter</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transaction Reference Number</label>
                <input type="text" className="form-control" required value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Confirm Payment Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
