/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { mic, stopCircle } from "ionicons/icons";
import { aiApi } from "../services/api";

interface SpeechRecorderProps {
  onTextReceived: (text: string) => void;
  onError: (message: string) => void;
}

const SpeechRecorder: React.FC<SpeechRecorderProps> = ({
  onTextReceived,
  onError,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Bắt đầu Ghi âm
  const startRecording = async () => {
    try {
      // Xin quyền truy cập Micro
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; // Xóa buffer cũ

      //Lắng nghe sự kiện 'data available' (khi có dữ liệu âm thanh)
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      //Lắng nghe sự kiện 'stop' (khi dừng ghi)
      mediaRecorderRef.current.onstop = () => {
        // Tạo file âm thanh (Blob) từ các 'chunks'
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        sendAudioToBackend(audioBlob);
      };

      //Bắt đầu ghi
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Could not access the micro", err);
      onError("Could not access the micro");
    }
  };

  // Dừng Ghi âm
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Tắt stream micro (để tắt đèn báo)
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Gửi file âm thanh lên Backend
  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const response = await aiApi.speechToText(audioBlob);

      const text = response.text;
      if (text) {
        onTextReceived(text); // Gửi text về component cha
      } else {
        onError("Can't recognize voice");
      }
    } catch (error: any) {
      console.error("Lỗi khi gửi file âm thanh:", error);
      onError(error.message || "Lỗi kết nối server AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center my-4">
      {isLoading ? (
        <IonSpinner name="crescent" />
      ) : (
        <IonButton
          shape="round"
          size="large"
          color={isRecording ? "danger" : "primary"}
          onClick={isRecording ? stopRecording : startRecording}
          className="w-20 h-20"
        >
          <IonIcon
            slot="icon-only"
            icon={isRecording ? stopCircle : mic}
            className="w-8 h-8"
          />
        </IonButton>
      )}
    </div>
  );
};

export default SpeechRecorder;
