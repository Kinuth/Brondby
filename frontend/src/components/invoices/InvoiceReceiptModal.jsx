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
        <div id="printable-invoice" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 text-slate-800 shadow-xs">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">BRONDBY ENTERPRISES LIMITED</h3>
                <p className="text-xs text-slate-600 font-medium">Corporate Due Diligence & Investigative Services</p>
                <p className="text-[11px] text-slate-400">Nairobi, Kenya • Operating across Pan-African Jurisdictions</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Invoice Number</div>
              <div className="text-base font-mono font-bold text-brand-600">{invoice.invoice_number}</div>
              <div className="mt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PAID
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> UNPAID
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Billed To:</span>
              <p className="text-sm font-bold text-slate-900">{invoice.client_name}</p>
              {invoice.job_detail?.client_detail?.company_name && (
                <p className="text-slate-600 font-medium">{invoice.job_detail.client_detail.company_name}</p>
              )}
              {invoice.job_detail?.client_detail?.address && (
                <p className="text-slate-500">{invoice.job_detail.client_detail.address}</p>
              )}
              {invoice.job_detail?.client_detail?.email && (
                <p className="text-slate-500">{invoice.job_detail.client_detail.email}</p>
              )}
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-500">Date Issued: </span>
                <span className="font-semibold text-slate-800">
                  {new Date(invoice.issued_date).toLocaleDateString()}
                </span>
              </div>
              {invoice.paid_date && (
                <div>
                  <span className="text-slate-500">Date Settled: </span>
                  <span className="font-semibold text-emerald-700">
                    {new Date(invoice.paid_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Associated Case Ref: </span>
                <span className="font-mono text-slate-800 font-semibold">#{invoice.job}</span>
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {invoice.service_type_name}
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Professional investigative report & document certification
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">1</td>
                  <td className="px-4 py-3 text-right text-slate-600">${Number(invoice.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">${Number(invoice.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Notes */}
          <div className="flex justify-between items-start text-xs pt-2">
            <div className="max-w-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Payment Instructions & Terms:</span>
              <p className="italic">{invoice.notes || 'Please remit payment to designated corporate escrow bank account within 30 days.'}</p>
            </div>

            <div className="w-48 space-y-1 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>${Number(invoice.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>VAT / Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total Due:</span>
                <span className="text-brand-600">${Number(invoice.amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <Printer className="w-4 h-4" />
            Print Official Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
