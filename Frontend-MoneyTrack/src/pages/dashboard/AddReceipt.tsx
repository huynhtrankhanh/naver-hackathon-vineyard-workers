import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonButton, IonSpinner, IonToast, IonIcon } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { trashOutline, addCircleOutline } from 'ionicons/icons';
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi, ocrApi } from "../../services/api";
import { useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";

interface ScannedItem {
  id: string; title: string; category: string; amount: number;
}

// Component Uploader nằm ngay trong file này cho tiện
const ReceiptUploader: React.FC<{
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any) => void;
  onAnalysisError: (message: string) => void;
}> = ({ onAnalysisStart, onAnalysisComplete, onAnalysisError }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onAnalysisStart();
    try {
      const result = await ocrApi.analyzeReceipt(file);
      if (result && result.items && result.items.length > 0) {
        onAnalysisComplete(result);
      } else {
        throw new Error("Không tìm thấy món hàng nào trong hóa đơn.");
      }
    } catch (error: any) {
      onAnalysisError(error.message || "Lỗi không xác định.");
    }
  };

  return (
    <div className="text-center p-4">
      <p className="text-slate-600 mb-4">Upload an invoice image to automatically generate multiple transactions.</p>
       <label htmlFor="ocr-upload-button" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
        Select Invoice File
      </label>
      <input id="ocr-upload-button" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

// Trang chính
const AddReceipt: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  
  const { refresh: refreshBalance } = useBalance();
  const invalidateOnMutation = useInvalidateOnMutation();
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";
  
  const expenseCategories = ['Food & Drinks', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];

  // Clear scanned items when user navigates to this page
  useEffect(() => {
    if (location.pathname === "/add-receipt") {
      setScannedItems([]);
      setLoading(false);
    }
  }, [location.pathname]);

  const handleAnalysisComplete = (data: any) => {
    const itemsFromOcr = data.items.map((item: {name: string, price: number}) => ({
      id: crypto.randomUUID(), title: item.name, amount: item.price, category: 'Other'
    }));
    setScannedItems(itemsFromOcr);
    setLoading(false);
    setToastMessage(`Đã quét được ${itemsFromOcr.length} mục. Vui lòng kiểm tra lại.`);
    setToastColor('success');
    setShowToast(true);
  };

  const handleAnalysisError = (message: string) => {
    setToastMessage(message); setToastColor('danger'); setShowToast(true); setLoading(false);
  };

  const handleItemChange = (id: string, field: keyof ScannedItem, value: string | number) => {
    setScannedItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setScannedItems(items => items.filter(item => item.id !== id));
  };

  const addItem = () => {
    setScannedItems(items => [...items, { id: crypto.randomUUID(), title: '', amount: 0, category: 'Other' }]);
  };

  const handleSubmitAll = async () => {
    if (scannedItems.length === 0) return;
    setLoading(true);
    let successCount = 0;
    for (const item of scannedItems) {
      if (item.title && item.amount > 0 && item.category) {
        try {
          await transactionApi.create({ title: item.title, category: item.category, amount: item.amount, type: 'expense', date: new Date().toISOString() });
          successCount++;
        } catch (error) { console.error(error); }
      }
    }
    invalidateOnMutation(); refreshBalance();
    setToastMessage(`Added ${successCount} transactions.`); setToastColor('success'); setShowToast(true);
    setTimeout(() => history.push('/dashboard'), 2000);
  };

  const totalAmount = scannedItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <IonPage>
      <IonContent>
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Add from Receipt" onBack={() => history.push("/add")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            {loading ? (
              <div className="flex justify-center p-8"><IonSpinner name="crescent" /></div>
            ) : scannedItems.length === 0 ? (
              <ReceiptUploader onAnalysisStart={() => setLoading(true)} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} />
            ) : (
              <div className="space-y-4">
                {scannedItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 space-y-3 relative">
                    <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><IonIcon icon={trashOutline} /></button>
                    <div><label className="text-xs text-slate-500">Title</label><input type="text" value={item.title} onChange={(e) => handleItemChange(item.id, 'title', e.target.value)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-slate-500">Amount (VND)</label><input type="number" value={item.amount} onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200" /></div>
                      <div><label className="text-xs text-slate-500">Category</label><select value={item.category} onChange={(e) => handleItemChange(item.id, 'category', e.target.value)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200">{expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    </div>
                  </div>
                ))}
                <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg"><IonIcon icon={addCircleOutline} />Add another item</button>
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg"><span>Total ({scannedItems.length} items):</span><span>{toCurrency(totalAmount)}</span></div>
                  <IonButton onClick={handleSubmitAll} expand="block" className="mt-4">Add {scannedItems.length} Transaction</IonButton>
                </div>
              </div>
            )}
            <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2500} color={toastColor} position="top" />
          </main>
          <TabBar active="add" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddReceipt;