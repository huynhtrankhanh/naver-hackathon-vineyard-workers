/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import Header from "../../components/dashboard/Header";
import TabBar from "../../components/dashboard/TabBar";
import { aiApi, transactionApi } from "../../services/api";
import { useInvalidateOnMutation } from "../../services/useStateInvalidation";
import { useBalance } from "../../services/BalanceContext";
import SpeechRecorder from "../../components/SpeechRecorder";

const AddTransactionVoice: React.FC = () => {
  const history = useHistory();

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

      // Dùng dữ liệu "sạch" để tạo chi tiêu
      // Chúng ta sẽ map "note" của AI vào "title"
      const transactionData = {
        title: parsedData.note,
        amount: parsedData.amount,
        type: parsedData.type,
        category: "Other", // AI chưa phân loại, ta để "Other"
        date: parsedData.date || new Date().toISOString(),
      };

      await transactionApi.create(transactionData);

      invalidateOnMutation(); // Hủy cache
      refreshBalance(); // Làm mới số dư

      showToastNotification(
        `Đã tạo: ${parsedData.note} - ${parsedData.amount.toLocaleString(
          "vi-VN"
        )} đ`,
        "success"
      );

      // Tự động quay về dashboard sau 2s
      setTimeout(() => {
        history.push("/dashboard");
      }, 2000);
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
