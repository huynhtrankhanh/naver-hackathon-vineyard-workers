
import axios from 'axios';
import OpenAI from 'openai';
const CLOVA_API_KEY = process.env.CLOVA_API_KEY;
// const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
// const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
// const API_HOST = 'https://clovastudio.stream.ntruss.com'; 

if (!CLOVA_API_KEY) {
    throw new Error("Vui lòng kiểm tra lại CLOVA_API_KEY và NCP_APIGW_API_KEY trong file .env");
}

const clova = new OpenAI({
    apiKey: CLOVA_API_KEY,
    baseURL: 'https://clovastudio.stream.ntruss.com/v1/openai', // Endpoint tương thích OpenAI
});
// Hàm chính để phân tích hóa đơn bằng LLM (HCX-005) 
export const analyzeReceiptWithLLM = async (imageBuffer: Buffer) => {
    const model = 'HCX-005';
    const imageBase64 = imageBuffer.toString('base64');
    const user_prompt = `Từ hình ảnh hóa đơn đính kèm, hãy bóc tách thông tin bao gồm: tên cửa hàng, tổng số tiền cuối cùng, và danh sách tất cả các món hàng kèm theo giá tiền. Trả về kết quả dưới dạng một đối tượng JSON có cấu trúc như sau: { "merchant": "tên cửa hàng", "total": số tiền tổng, "items": [{ "name": "tên món hàng", "price": giá tiền }] }. Bỏ qua các dòng thuế, giảm giá. Nếu không đọc được tên cửa hàng, hãy điền "Cửa hàng bán lẻ". Chỉ trả về JSON, không giải thích gì thêm.`;

    try {
        console.log("Đang gửi yêu cầu đến CLOVA (chế độ tương thích OpenAI)...");
        const response = await clova.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
                        { type: 'text', text: user_prompt }
                    ],
                },
            ],
            max_tokens: 1024, // Lưu ý: snake_case
            temperature: 0.1,
            top_p: 0.8,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("AI không trả về nội dung.");
        }
        
        // Logic trích xuất JSON từ text trả về
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI không trả về định dạng JSON hợp lệ.");
        }
        
        const result = JSON.parse(jsonMatch[0]);
        console.log("CLOVA (OpenAI compat) đã trả về kết quả đã parse:", result);
        return result;
        
    } catch (error: any) {
        console.error("Lỗi khi gọi API CLOVA (OpenAI compat):", error);
        throw new Error('Không thể phân tích hóa đơn bằng AI.');
    }
};