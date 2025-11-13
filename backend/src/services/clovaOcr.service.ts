import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import axios from 'axios';

const OCR_API_URL = process.env.CLOVA_OCR_API_URL;
const OCR_SECRET_KEY = process.env.CLOVA_OCR_SECRET_KEY;

if (!OCR_API_URL || !OCR_SECRET_KEY) {
    throw new Error("Vui lòng kiểm tra lại CLOVA_OCR_API_URL và CLOVA_OCR_SECRET_KEY trong file .env");
}

// THAY THẾ TOÀN BỘ HÀM normalizeOcrResult BẰNG PHIÊN BẢN TỔNG HỢP NÀY

function normalizeOcrResult(ocrData: any) {
    const imageResult = ocrData.images?.[0];
    if (imageResult?.inferResult === 'ERROR') {
        throw new Error(`CLOVA OCR báo lỗi: ${imageResult.message}`);
    }

    const fields = imageResult?.fields;
    if (!fields || fields.length === 0) {
        return { merchant: "Không đọc được", date: "N/A", total: 0, items: [] };
    }

    // --- BẮT ĐẦU PHIÊN BẢN TỔNG HỢP CUỐI CÙNG ---

    const Y_TOLERANCE = 15;
    const items: { name: string; price: number }[] = [];
    const imageWidth = imageResult.convertedImageInfo.width;

    // 1. TỰ ĐỘNG PHÁT HIỆN WATERMARK
    const wordFrequencies: { [key: string]: number } = {};
    for (const field of fields) {
        const word = field.inferText.toLowerCase();
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    }
    const watermarkWords = new Set<string>();
    for (const word in wordFrequencies) {
        if (wordFrequencies[word] > 5 && word.length > 2 && isNaN(parseInt(word))) {
            watermarkWords.add(word);
        }
    }
    console.log("DEBUG 1: Watermark tìm thấy:", Array.from(watermarkWords));
    const cleanedFields = fields.filter((field: any) => !watermarkWords.has(field.inferText.toLowerCase()));
    console.log(`DEBUG 2: Số field ban đầu: ${fields.length}, Sau khi lọc: ${cleanedFields.length}`);
    // Sắp xếp các field đã sạch từ trên xuống
    cleanedFields.sort((a: any, b: any) => a.boundingPoly.vertices[0].y - b.boundingPoly.vertices[0].y);

    // 2. TÌM RANH GIỚI HEADER VÀ FOOTER (trên dữ liệu đã sạch)
    const headerEndKeywords = ['date', 'time', 'qty', 'item', 'desc', 'description', 'price', 'amt'];
    const footerStartKeywords = ['total', 'tổng', 'sub-total', 'subtotal', 'tax', 'vat', 'change', 'amount', 'balance'];
    
    let headerEndY = 0;
    const lastHeaderField = cleanedFields.findLast((f: any) => headerEndKeywords.some(kw => f.inferText.toLowerCase().includes(kw)));
    if (lastHeaderField) headerEndY = lastHeaderField.boundingPoly.vertices[2].y;

    let footerStartY = Infinity;
    const firstFooterField = cleanedFields.find((f: any) => footerStartKeywords.some(kw => f.inferText.toLowerCase().includes(kw)));
    if (firstFooterField) footerStartY = firstFooterField.boundingPoly.vertices[0].y;
     console.log(`DEBUG 3: Ranh giới Header-Y: ${headerEndY}, Ranh giới Footer-Y: ${footerStartY}`);
    // HÀM KIỂM TRA GIÁ TIỀN ĐƠN GIẢN VÀ HIỆU QUẢ
    const isPrice = (field: any) => {
        const isRightSide = field.boundingPoly.vertices[0].x > imageWidth * 0.5;
        const containsNumber = /\d/.test(field.inferText);
        const numericValue = parseFloat(field.inferText.replace(/[^0-9.]/g, ''));
        return isRightSide && containsNumber && !isNaN(numericValue) && numericValue >= 0;
    };

    // 3. Bóc tách Items chỉ trong vùng BODY bằng "Phân cụm"
    const itemRegionFields = cleanedFields.filter((field: any) => 
        (headerEndY === 0 || field.boundingPoly.vertices[0].y > headerEndY) &&
        field.boundingPoly.vertices[2].y < footerStartY
    );
    console.log(`DEBUG 4: Tìm thấy ${itemRegionFields.length} field trong vùng item.`);
    const priceFieldsInItemRegion = itemRegionFields.filter(isPrice);
    console.log(`DEBUG 5: Trong đó, có ${priceFieldsInItemRegion.length} field là giá tiền.`);
    for (const priceField of priceFieldsInItemRegion) {
        const priceCenterY = (priceField.boundingPoly.vertices[0].y + priceField.boundingPoly.vertices[2].y) / 2;
        
        const nameParts = itemRegionFields.filter((nameField: any) => {
            if (nameField === priceField || isPrice(nameField)) return false;
            const nameCenterY = (nameField.boundingPoly.vertices[0].y + nameField.boundingPoly.vertices[2].y) / 2;
            return Math.abs(priceCenterY - nameCenterY) < Y_TOLERANCE &&
                   nameField.boundingPoly.vertices[1].x < priceField.boundingPoly.vertices[0].x;
        });

        if (nameParts.length > 0) {
            nameParts.sort((a: any, b: any) => a.boundingPoly.vertices[0].x - b.boundingPoly.vertices[0].x);
            
            // LOGIC PHÂN CỤM THEO KHOẢNG CÁCH (TÍCH HỢP LẠI)
            const avgCharWidth = nameParts.reduce((sum: number, p: any) => sum + (p.boundingPoly.vertices[1].x - p.boundingPoly.vertices[0].x) / (p.inferText.length || 1), 0) / nameParts.length;
            const SPACE_THRESHOLD = avgCharWidth * 4;

            const clusters: any[][] = [];
            let currentCluster: any[] = [];

            for (let i = 0; i < nameParts.length; i++) {
                if (currentCluster.length === 0) {
                    currentCluster.push(nameParts[i]);
                } else {
                    const lastWord = currentCluster[currentCluster.length - 1];
                    const currentWord = nameParts[i];
                    const distance = currentWord.boundingPoly.vertices[0].x - lastWord.boundingPoly.vertices[1].x;
                    
                    if (distance < SPACE_THRESHOLD && distance > -5) {
                        currentCluster.push(currentWord);
                    } else {
                        clusters.push(currentCluster);
                        currentCluster = [currentWord];
                    }
                }
            }
            if (currentCluster.length > 0) {
                clusters.push(currentCluster);
            }
            
            // CHỌN CỤM TỐT NHẤT: Ưu tiên cụm có nhiều chữ cái nhất
            let bestCluster = clusters[0];
            let maxLetterCount = 0;
            
            for (const cluster of clusters) {
                const text = cluster.map((p: any) => p.inferText).join(' ');
                const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
                if (letterCount > maxLetterCount) {
                    maxLetterCount = letterCount;
                    bestCluster = cluster;
                }
            }
            
            if (bestCluster) {
                let itemName = bestCluster.map((part: any) => part.inferText).join(' ');
                itemName = itemName.replace(/^\d+\s*[xX×]\s*/, '').trim();
                const price = parseFloat(priceField.inferText.replace(/[^0-9.]/g, ''));
                
                if (itemName && /[a-zA-Z]/.test(itemName) && !/^\#\d+$/.test(itemName)) {
                    items.push({ name: itemName, price });
                }
            }
        }
    }
    const finalItems = Array.from(new Set(items.map((item: any) => JSON.stringify(item))))
                           .map((str: string) => JSON.parse(str));
    console.log("DEBUG 6: Items cuối cùng tìm được:", finalItems);                   
    // 4. Tự tính tổng từ items
    const total = finalItems.reduce((sum: number, item: any) => sum + item.price, 0);
    const finalTotal = Math.round(total * 100) / 100;

    // 5. Tìm các thông tin còn lại
    const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
    const dateField = cleanedFields.find((f: any) => dateRegex.test(f.inferText));
    const date = dateField ? dateField.inferText.match(dateRegex)![0] : 'N/A';
    
    const headerFields = cleanedFields.filter((f:any) => headerEndY === 0 || f.boundingPoly.vertices[2].y < headerEndY);
    const merchant = headerFields.find((f: any) => /[a-zA-Z]/.test(f.inferText) && !f.inferText.includes('*'))?.inferText || "Không rõ";

    return {
        merchant,
        date,
        total: finalTotal,
        items: finalItems,
        raw: ocrData 
    };
}
// Hàm export chính không thay đổi
export const analyzeReceiptFromBuffer = async (imageBuffer: Buffer) => {
    
    const requestJson = {
        images: [{ format: 'jpeg', name: 'receipt' }],
        requestId: uuidv4(),
        version: 'V2',
        timestamp: Date.now(),
    };

    const payload = JSON.stringify(requestJson);
    const formData = new FormData();
    formData.append('message', payload);
    formData.append('file', imageBuffer, 'receipt.jpeg');

    try {
        const response = await axios.post(OCR_API_URL!, formData, {
            headers: { 'X-OCR-SECRET': OCR_SECRET_KEY! },
        });
        
        return normalizeOcrResult(response.data);

    } catch (error: any) {
        console.error("Lỗi nghiêm trọng khi gọi API CLOVA OCR:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error("Không thể kết nối hoặc xử lý ảnh với dịch vụ CLOVA OCR.");
    }
}