/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { aiApi, transactionApi } from "../../services/api";
import { useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";
import SpeechRecorder from "../../components/SpeechRecorder";

const AddTransactionVoice: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  // SỬ DỤNG CÁC HOOKS TỪ 'AddTransaction.tsx'
  const { refresh: refreshBalance } = useBalance();
  const invalidateOnMutation = useInvalidateOnMutation();

  // State cho thông báo (giống AddTransaction.tsx)
  const [loading, setLoading] = useState(false); // Thêm state loading
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("danger");

  // State để hiển thị kết quả (của trang này)
  const [sttResult, setSttResult] = useState("");
  const [nluResult, setNluResult] = useState<any>(null);
  const [editTransaction, setEditTransaction] = useState<any>(null);

  // Clear results when user navigates to this page
  useEffect(() => {
    if (location.pathname === "/add-voice") {
      setSttResult("");
      setNluResult(null);
      setLoading(false);
    }
  }, [location.pathname]);

  // Hàm hiển thị thông báo
  const showToastNotification = (
    message: string,
    color: "success" | "danger"
  ) => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // === 4. PIPELINE HOÀN CHỈNH (ĐÃ CẬP NHẬT) ===
  const handleTextFromSpeech = async (text: string) => {
    console.log("STT Trả về:", text);
    setSttResult(text);
    setNluResult(null); // Xóa kết quả cũ
    setLoading(true); // Bật loading

    try {
      // Gửi text thô lên backend AI (LLM) để bóc tách
      const parsedData = await aiApi.parseTransactionText(text);
      // parsedData = { note: "coffee", amount: 20000, type: "expense", date: "..." }
      console.log("AI Bóc tách:", parsedData);
      setNluResult(parsedData); // Hiển thị kết quả bóc tách

      // Prepare editable transaction object (mirror OCR UI behaviour)
      const prepared = {
        title: parsedData.title || "",
        amount: parsedData.amount || 0,
        type: parsedData.type || "expense",
        category: parsedData.category || "Other",
        date: parsedData.date || new Date().toISOString(),
      };

      setEditTransaction(prepared);
    } catch (error: any) {
      console.error("Lỗi pipeline STT -> NLU:", error);
      showToastNotification(
        error.message || "Không thể xử lý giọng nói",
        "danger"
      );
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  const expenseCategories = [
    "Food & Drinks",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other",
  ];

  const handleEditChange = (field: string, value: any) => {
    setEditTransaction((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async () => {
    if (!editTransaction) return;
    if (
      !editTransaction.title ||
      !editTransaction.amount ||
      editTransaction.amount <= 0
    ) {
      showToastNotification(
        "Vui lòng điền đầy đủ tiêu đề và số tiền hợp lệ.",
        "danger"
      );
      return;
    }

    setLoading(true);
    try {
      await transactionApi.create({
        title: editTransaction.title,
        amount: Number(editTransaction.amount),
        type: editTransaction.type || "expense",
        category: editTransaction.category || "Other",
        date: editTransaction.date || new Date().toISOString(),
      });

      invalidateOnMutation(); // Hủy cache
      refreshBalance();

      showToastNotification(
        `Đã tạo: ${editTransaction.title} - ${Number(
          editTransaction.amount
        ).toLocaleString("vi-VN")} đ`,
        "success"
      );
      setTimeout(() => history.push("/dashboard"), 1800);
    } catch (err: any) {
      console.error(err);
      showToastNotification(err.message || "Lỗi khi tạo giao dịch", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTransaction(null);
    setNluResult(null);
    setSttResult("");
  };

  return (
    <IonPage>
      <IonContent className="bg-white">
        <div className="min-h-screen bg-white text-slate-900 flex flex-col">
          <Header
            title="Add by Voice"
            onBack={() => history.push("/dashboard")}
          />

          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4">
            <h1 className="text-2xl font-bold text-center text-slate-800">
              Talk to create new transaction
            </h1>
            <p className="text-center text-gray-500 text-sm mb-4">
              "Coffee 20k" or "Received salary 1000k"
            </p>

            {!loading && (
              <SpeechRecorder
                onTextReceived={handleTextFromSpeech}
                onError={(msg) => showToastNotification(msg, "danger")}
              />
            )}

            {loading && (
              <div className="flex justify-center items-center my-4 h-20">
                <IonSpinner name="crescent" />
              </div>
            )}

            {sttResult && (
              <IonCard className="mt-4">
                <IonCardHeader>
                  <IonCardTitle className="text-sm font-medium text-slate-600">
                    1.STT Result:
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <pre className="text-lg font-mono text-slate-800">
                    {sttResult}
                  </pre>
                </IonCardContent>
              </IonCard>
            )}

            {nluResult && (
              <IonCard color="success">
                <IonCardHeader>
                  <IonCardTitle className="text-sm font-medium">
                    2. AI Hiểu NLU Result:
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <pre className="text-lg font-mono">
                    {JSON.stringify(nluResult, null, 2)}
                  </pre>
                </IonCardContent>
              </IonCard>
            )}

            {editTransaction && (
              <div className="mt-4">
                <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                  <div>
                    <label className="text-xs text-slate-500">Title</label>
                    <input
                      type="text"
                      value={editTransaction.title}
                      onChange={(e) =>
                        handleEditChange("title", e.target.value)
                      }
                      className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">
                        Amount (VND)
                      </label>
                      <input
                        type="number"
                        value={editTransaction.amount}
                        onChange={(e) =>
                          handleEditChange(
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Category</label>
                      <select
                        value={editTransaction.category}
                        onChange={(e) =>
                          handleEditChange("category", e.target.value)
                        }
                        className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                      >
                        {expenseCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500">Type</label>
                      <select
                        value={editTransaction.type}
                        onChange={(e) =>
                          handleEditChange("type", e.target.value)
                        }
                        className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Date</label>
                      <input
                        type="datetime-local"
                        value={new Date(editTransaction.date)
                          .toISOString()
                          .slice(0, 16)}
                        onChange={(e) =>
                          handleEditChange(
                            "date",
                            new Date(e.target.value).toISOString()
                          )
                        }
                        className="w-full bg-slate-50 px-3 py-2 rounded-md border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <IonButton expand="block" onClick={handleConfirm}>
                      Confirm
                    </IonButton>
                    <IonButton
                      expand="block"
                      color="medium"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </IonButton>
                  </div>
                </div>
              </div>
            )}
          </main>

          <TabBar active="add" />
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default AddTransactionVoice;
