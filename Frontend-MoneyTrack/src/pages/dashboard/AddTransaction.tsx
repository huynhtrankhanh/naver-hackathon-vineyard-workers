// src/pages/AddTransaction.tsx (PHIÊN BẢN GIỮ LẠI CẢ 2 LUỒNG)

import React, { useState, useEffect } from "react";
import { IonPage, IonContent, IonButton, IonSpinner, IonToast, IonIcon } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { trashOutline, addCircleOutline } from 'ionicons/icons';
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { transactionApi, budgetApi, ocrApi } from "../../services/api";
import { useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";
<<<<<<< Updated upstream
=======
import { mic, camera } from "ionicons/icons";
>>>>>>> Stashed changes

// Interface cho các mục đã quét
interface ScannedItem {
  id: string; title: string; category: string; amount: number;
}
interface Budget { _id: string; category: string; limit: number; spent: number; month: string; }

// ==============================================================================
// COMPONENT UPLOADER - Giữ nguyên, chỉ để upload
// ==============================================================================
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
      <p className="text-slate-600 mb-4">Tải lên ảnh hóa đơn để tạo nhiều giao dịch tự động.</p>
       <label htmlFor="ocr-upload-button" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
        Chọn File Hóa Đơn
      </label>
      <input id="ocr-upload-button" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};


// ==============================================================================
// COMPONENT CHÍNH - Logic được cập nhật
// ==============================================================================
const AddTransaction: React.FC = () => {
  const history = useHistory();
  
  // State quản lý chế độ hiển thị
  const [mode, setMode] = useState<'manual' | 'ocr'>('manual');
  
  // State cho form thủ công
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  // State cho danh sách item từ OCR
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance();
  const invalidateOnMutation = useInvalidateOnMutation();
  const toCurrency = (v: number) => v.toLocaleString("vi-VN") + " đ";

  const expenseCategories = ['Food & Drinks', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other'];
  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  // HÀM SUBMIT CHO FORM THỦ CÔNG - Giữ nguyên
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !amount || parseFloat(amount) <= 0) {
      setToastMessage('Vui lòng điền đầy đủ thông tin.'); setToastColor('danger'); setShowToast(true); return;
    }
    setLoading(true);
    try {
      await transactionApi.create({
        title: title.trim(), category, amount: parseFloat(amount),
        type, date: new Date().toISOString()
      });
      invalidateOnMutation();
      refreshBalance();
      setToastMessage('Thêm giao dịch thành công!'); setToastColor('success'); setShowToast(true);
      setTitle(''); setCategory(''); setAmount('');
      setTimeout(() => history.push('/dashboard'), 1500);
    } catch (error) {
      setToastMessage('Thêm giao dịch thất bại.'); setToastColor('danger'); setShowToast(true);
    } finally {
      setLoading(false);
    }
  };
  
  // HÀM XỬ LÝ KHI OCR XONG - Chỉ cập nhật danh sách nháp
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
    setToastMessage(message); setToastColor('danger'); setShowToast(true);
    setLoading(false);
  };

  // HÀM SUBMIT KHI Ở CHẾ ĐỘ OCR
  const handleSubmitScanned = async () => {
     if (scannedItems.length === 0) {
      setToastMessage('Không có giao dịch nào để thêm.'); setToastColor('danger'); setShowToast(true); return;
    }
    setLoading(true);
    let successCount = 0;
    for (const item of scannedItems) {
      try {
        await transactionApi.create({ title: item.title, category: item.category, amount: item.amount, type: 'expense', date: new Date().toISOString() });
        successCount++;
      } catch (error) { /* ... */ }
    }
    invalidateOnMutation(); refreshBalance();
    setToastMessage(`Đã thêm ${successCount} giao dịch.`); setToastColor('success'); setShowToast(true);
    setTimeout(() => history.push('/dashboard'), 2000);
  };

  // Các hàm helper cho chế độ OCR
  const handleScannedItemChange = (id: string, field: keyof ScannedItem, value: string | number) => {
    setScannedItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeScannedItem = (id: string) => {
    setScannedItems(items => items.filter(item => item.id !== id));
  };
  const addEmptyScannedItem = () => {
    setScannedItems(items => [...items, { id: crypto.randomUUID(), title: '', amount: 0, category: 'Other' }]);
  };
  const totalScannedAmount = scannedItems.reduce((sum, item) => sum + item.amount, 0);


  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header title="Add Transaction" onBack={() => history.push("/dashboard")} />
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            
            {/* Box hiển thị số dư và nút chuyển chế độ */}
            <div className="rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
                <div className="text-sm text-slate-600 mb-1">Current Balance</div>
                <div className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{toCurrency(balance)}</div>
                {balance < 0 && <div className="text-xs text-rose-600 mt-1">⚠️ Negative balance...</div>}
                
                <div className="grid grid-cols-2 gap-3 mt-4 p-1 bg-slate-100 rounded-xl">
                    <button onClick={() => setMode('manual')} className={`py-2 rounded-lg font-medium ${mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>Nhập thủ công</button>
                    <button onClick={() => setMode('ocr')} className={`py-2 rounded-lg font-medium ${mode === 'ocr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}>Quét hóa đơn (OCR)</button>
                </div>
            </div>

<<<<<<< Updated upstream
            {loading && <div className="flex justify-center p-8"><IonSpinner name="crescent" /></div>}

            {/* HIỂN THỊ CÓ ĐIỀU KIỆN */}
            <div className={loading ? 'hidden' : ''}>
              {mode === 'manual' ? (
                // LUỒNG NHẬP THỦ CÔNG (CODE GỐC CỦA CHỊ)
                <form onSubmit={handleSubmitManual} className="space-y-4">
                  {/* ... Dán toàn bộ code thẻ <form> của chị vào đây ... */}
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">Type</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => { setType('expense'); setCategory(''); }} className={`py-3 px-4 rounded-xl font-medium transition-colors ${type === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Expense</button><button type="button" onClick={() => { setType('income'); setCategory(''); }} className={`py-3 px-4 rounded-xl font-medium transition-colors ${type === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Income</button></div></div>
                  <div><label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Title</label><input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Coffee at Highlands" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none" required /></div>
                  <div><label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-white" required><option value="">Select a category</option>{categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                  <div><label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">Amount (VND)</label><input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" min="0" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none" required /></div>
                  <IonButton type="submit" expand="block" disabled={loading} className="mt-6" color={type === 'expense' ? 'danger' : 'success'}>Add Transaction</IonButton>
                </form>
              ) : (
                // LUỒNG QUÉT HÓA ĐƠN
                scannedItems.length === 0 ? (
                    <ReceiptUploader onAnalysisStart={() => setLoading(true)} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} />
                ) : (
                    <div className="space-y-4">
                        {scannedItems.map((item) => (
                          <div key={item.id} className="p-3 rounded-xl border border-slate-200 space-y-3 relative">
                              <button onClick={() => removeScannedItem(item.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><IonIcon icon={trashOutline} /></button>
                              <div><label className="text-xs text-slate-500">Title</label><input type="text" value={item.title} onChange={(e) => handleScannedItemChange(item.id, 'title', e.target.value)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200" /></div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div><label className="text-xs text-slate-500">Amount (VND)</label><input type="number" value={item.amount} onChange={(e) => handleScannedItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200" /></div>
                                  <div><label className="text-xs text-slate-500">Category</label><select value={item.category} onChange={(e) => handleScannedItemChange(item.id, 'category', e.target.value)} className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200">{expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                              </div>
                          </div>
                        ))}
                        <button onClick={addEmptyScannedItem} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg"><IonIcon icon={addCircleOutline} />Thêm mục khác</button>
                        <div className="border-t border-slate-200 pt-4 mt-4">
                          <div className="flex justify-between font-bold text-lg"><span>Tổng cộng ({scannedItems.length} mục):</span><span>{toCurrency(totalScannedAmount)}</span></div>
                          <IonButton onClick={handleSubmitScanned} expand="block" className="mt-4">Thêm {scannedItems.length} Giao dịch</IonButton>
                        </div>
=======
            <IonButton
              fill="outline"
              expand="block"
              onClick={() => history.push("/add-voice")}
              className="mb-4"
            >
              <IonIcon icon={mic} slot="start" />
              Add by Voice
            </IonButton>
            <IonButton
              fill="outline"
              expand="block"
              onClick={() => history.push("/add-receipt")} // Điều hướng đến trang mới
              className="mb-4"
            >
              <IonIcon icon={camera} slot="start" />
              Add by Receipt (OCR)
            </IonButton>
            <p className="text-center text-gray-500 my-2">Or enter manualy</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType("expense");
                      setCategory("");
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      type === "expense"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType("income");
                      setCategory("");
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                      type === "income"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Coffee at Highlands"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Budget Limit Info */}
                {type === "expense" && selectedBudget && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Budget for {selectedBudget.category}
>>>>>>> Stashed changes
                    </div>
                )
              )}
            </div>

            <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2500} color={toastColor} position="top" />
          </main>
          <TabBar active="add" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddTransaction;