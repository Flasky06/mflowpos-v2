import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface VoidSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  receiptNumber: string | null;
  onSuccess?: () => void;
}

export const VoidSaleModal: React.FC<VoidSaleModalProps> = ({
  isOpen,
  onClose,
  saleId,
  receiptNumber,
  onSuccess,
}) => {
  const addToast = useToastStore((state) => state.addToast);
  const [isVoiding, setIsVoiding] = useState(false);

  const handleConfirmVoid = async () => {
    if (!saleId) return;

    setIsVoiding(true);
    try {
      await apiClient.put(`/sales/${saleId}/cancel`);
      addToast({
        type: 'success',
        title: 'Transaction Voided',
        message: `Sale receipt '${receiptNumber || saleId}' cancelled and inventory restocked.`,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to void sale transaction.';
      addToast({ type: 'error', title: 'Void Error', message: msg });
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Transaction & Restore Inventory"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-rose-900 uppercase">Warning: Irreversible Operation</h4>
            <p className="text-xs text-rose-700 font-medium mt-0.5">
              Voiding receipt <strong className="font-mono font-bold">{receiptNumber || 'Transaction'}</strong> will cancel the transaction, automatically restore sold item quantities back into branch inventory stock, and adjust customer credit balance.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isVoiding}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={isVoiding}
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleConfirmVoid}
          >
            Confirm Void & Restock
          </Button>
        </div>
      </div>
    </Modal>
  );
};
