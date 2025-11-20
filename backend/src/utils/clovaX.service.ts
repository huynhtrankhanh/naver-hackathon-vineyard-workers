
import axios from 'axios';
import OpenAI from 'openai';
const CLOVA_API_KEY = process.env.CLOVA_API_KEY;
// const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
// const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
// const API_HOST = 'https://clovastudio.stream.ntruss.com'; 

let clova: OpenAI | null = null;

// Initialize Clova client only if API key is available
if (CLOVA_API_KEY) {
    clova = new OpenAI({
        apiKey: CLOVA_API_KEY,
        baseURL: 'https://clovastudio.stream.ntruss.com/v1/openai', // Endpoint tương thích OpenAI
    });
}

const USD_TO_VND_RATE = 25000; 
// Hàm chính để phân tích hóa đơn bằng LLM (HCX-005) 

export const analyzeReceiptWithLLM = async (imageBuffer: Buffer) => {
    if (!CLOVA_API_KEY || !clova) {
        throw new Error("Vui lòng kiểm tra lại CLOVA_API_KEY và NCP_APIGW_API_KEY trong file .env");
    }
    
    const model = 'HCX-005';
    const imageBase64 = imageBuffer.toString('base64');
        const user_prompt = `From the attached receipt image, act as a meticulous data extraction expert. Your task is to extract the merchant's name, the final total amount, and a list of all purchased items WITH their spending categories.

**Follow these rules strictly:**
1.  **Item Definition:** Treat EACH line that has a distinct price on the right-hand side as a SEPARATE item. Do not merge items from different lines, even if their names seem related.
2.  **Category Detection:** For EACH item, determine the most appropriate spending category from this EXACT list:
    - Food & Drinks (for food, beverages, groceries, restaurants, cafes)
    - Transport (for taxi, bus, train, fuel, parking, vehicle maintenance)
    - Shopping (for clothing, electronics, household items, general retail)
    - Bills (for utilities, phone, internet, rent, insurance)
    - Entertainment (for movies, games, hobbies, subscriptions, recreation)
    - Healthcare (for medicine, doctor visits, pharmacy, medical supplies)
    - Education (for books, courses, tuition, school supplies)
    - Other (only if item doesn't fit any category above)
3.  **Output Format:** Return the result ONLY as a single, valid JSON object. Do not add any extra text or explanations. The JSON structure must be exactly:
    \`\`\`json
    {
      "merchant": "string",
      "receiptLikelyInUSD": "boolean",
      "total": number,
      "items": [
        { "name": "string", "price": number, "category": "string" }
      ]
    }
    \`\`\`
4.  **Exclusions:** Explicitly ignore any lines related to "Total", "Cash", "Change", "Tax", "VAT", "Discount", "Subtotal" from the items list.
5.  **Default Values:** If the merchant name cannot be found, use the string "Retail Store".
6.  **Category Rules:** 
    - Use ONLY the exact category names listed in rule #2
    - Be intelligent about categorization based on item names
    - Default to "Other" only when truly uncertain
`;
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
        const resultFromAI = JSON.parse(jsonMatch[0]);

                console.log("Kết quả gốc từ AI (USD):", resultFromAI);

        const convertedItems = resultFromAI.items.map((item: { name: string, price: number, category?: string }) => ({
            ...item,
            price: Math.round(item.price * (resultFromAI.receiptLikelyInUSD ? USD_TO_VND_RATE : 1)), // Quy đổi và làm tròn
            category: item.category || 'Other' // Ensure category exists, default to 'Other'
        }));

        const convertedTotal = convertedItems.reduce((sum: number, item: { price: number }) => sum + item.price, 0);

        const finalResult = {
            ...resultFromAI,
            items: convertedItems,
            total: convertedTotal, // Cập nhật lại total sau khi quy đổi
        };
        console.log("Kết quả cuối cùng (VND):", finalResult);
        return finalResult;
        
    }  catch (error: any) {
        console.error("Lỗi khi gọi API CLOVA (OpenAI compat):", error);
        throw new Error('Không thể phân tích hóa đơn bằng AI.');
    }
};
