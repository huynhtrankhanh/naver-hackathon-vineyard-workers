import React, { useState } from 'react';

const ReceiptUploader: React.FC = () => {
    // State để lưu file ảnh người dùng đã chọn
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Hàm được gọi khi người dùng chọn một file
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
            console.log("File đã chọn:", event.target.files[0].name);
        }
    };

    // Hàm được gọi khi người dùng nhấn nút "Phân tích Hóa đơn"
    const handleSubmit = () => {
        if (!selectedFile) {
            alert("Vui lòng chọn một file ảnh hóa đơn!");
            return;
        }
        
        // Ở các bước tiếp theo, chúng ta sẽ gọi API backend từ đây
        console.log("Chuẩn bị gửi file đi phân tích:", selectedFile);
        // TODO: Gọi API service
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Thêm Giao Dịch Mới</h2>
            <p className="mb-4">Tải lên ảnh hóa đơn của bạn để hệ thống tự động phân tích.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input 
                    type="file" 
                    accept="image/*" // Chỉ chấp nhận các file ảnh
                    onChange={handleFileChange}
                    className="mb-4"
                />

                {selectedFile && (
                    <p className="text-gray-600 mb-4">
                        Đã chọn file: <strong>{selectedFile.name}</strong>
                    </p>
                )}

                <button 
                    onClick={handleSubmit}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Phân tích Hóa đơn
                </button>
            </div>
        </div>
    );
};

export default ReceiptUploader;