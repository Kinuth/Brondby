import React from 'react';
import { Modal } from '../common/Modal';
import { Printer, ShieldCheck, CheckCircle, Clock } from 'lucide-react';

export const InvoiceReceiptModal = ({ isOpen, onClose, invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice: ${invoice.invoice_number}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div id="printable-invoice" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-6 text-slate-200">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg tracking-tight">BRONDBY ENTERPRISES LIMITED</h3>
                <p className="text-xs text-slate-400">Corporate Due Diligence & Investigative Services</p>
                <p className="text-[11px] text-slate-500">Nairobi, Kenya • Operating across Pan-African Jurisdictions</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Invoice Number</div>
              <div className="text-base font-mono font-bold text-brand-400">{invoice.invoice_number}</div>
              <div className="mt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" /> PAID
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" /> UNPAID
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Billed To:</span>
              <p className="text-sm font-bold text-white">{invoice.client_name}</p>
              {invoice.job_detail?.client_detail?.company_name && (
                <p className="text-slate-300">{invoice.job_detail.client_detail.company_name}</p>
              )}
              {invoice.job_detail?.client_detail?.address && (
                <p className="text-slate-400">{invoice.job_detail.client_detail.address}</p>
              )}
              {invoice.job_detail?.client_detail?.email && (
                <p className="text-slate-400">{invoice.job_detail.client_detail.email}</p>
              )}
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-400">Date Issued: </span>
                <span className="font-semibold text-slate-200">
                  {new Date(invoice.issued_date).toLocaleDateString()}
                </span>
              </div>
              {invoice.paid_date && (
                <div>
                  <span className="text-slate-400">Date Settled: </span>
                  <span className="font-semibold text-emerald-400">
                    {new Date(invoice.paid_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400">Associated Job Ref: </span>
                <span className="font-mono text-slate-200">#{invoice.job}</span>
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="px-4 py-3 font-medium text-white">
                    {invoice.service_type_name}
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Professional investigative report & document certification
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">1</td>
                  <td className="px-4 py-3 text-right text-slate-300">${Number(invoice.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-white">${Number(invoice.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Notes */}
          <div className="flex justify-between items-start text-xs pt-2">
            <div className="max-w-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">Payment Instructions & Notes:</span>
              <p className="italic">{invoice.notes || 'Please remit payment to designated corporate escrow bank account within 30 days.'}</p>
            </div>

            <div className="w-48 space-y-1 text-right">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${Number(invoice.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxes / VAT (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-1.5">
                <span>Total Due:</span>
                <span className="text-brand-400">${Number(invoice.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
