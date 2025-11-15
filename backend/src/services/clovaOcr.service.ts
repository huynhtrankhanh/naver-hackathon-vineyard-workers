import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import axios from 'axios';

const OCR_API_URL = process.env.CLOVA_OCR_API_URL;
const OCR_SECRET_KEY = process.env.CLOVA_OCR_SECRET_KEY;

if (!OCR_API_URL || !OCR_SECRET_KEY) {
    throw new Error("Vui lòng kiểm tra lại CLOVA_OCR_API_URL và CLOVA_OCR_SECRET_KEY trong file .env");
}

function normalizeOcrResult(ocrData: any) {
    const imageResult = ocrData.images?.[0];
    if (imageResult?.inferResult === 'ERROR') {
        throw new Error(`CLOVA OCR báo lỗi: ${imageResult.message}`);
    }

    const fields = imageResult?.fields;
    if (!fields || fields.length === 0) {
        return { merchant: "Không đọc được", date: "N/A", total: 0, items: [] };
    }

    const Y_TOLERANCE = 15;
    const items: { name: string; price: number }[] = [];
    const imageWidth = imageResult.convertedImageInfo.width;
    
    fields.sort((a: any, b: any) => a.boundingPoly.vertices[0].y - b.boundingPoly.vertices[0].y);

    const headerEndKeywords = ['date', 'time', 'qty', 'item', 'desc', 'description', 'amt'];
    const footerStartKeywords = ['total', 'tổng', 'sub-total', 'subtotal', 'tax', 'vat', 'change', 'amount', 'balance'];
    
    let headerEndY = 0;
    const lastHeaderField = fields.findLast((f: any) => headerEndKeywords.some(kw => f.inferText.toLowerCase().includes(kw)));
    if (lastHeaderField) headerEndY = lastHeaderField.boundingPoly.vertices[2].y;

    let footerStartY = Infinity;
    const firstFooterField = fields.find((f: any) => footerStartKeywords.some(kw => f.inferText.toLowerCase().includes(kw)));
    if (firstFooterField) footerStartY = firstFooterField.boundingPoly.vertices[0].y;

    console.log(`DEBUG 3: Ranh giới Header-Y: ${headerEndY}, Ranh giới Footer-Y: ${footerStartY}`);

    // HÀM PARSE GIÁ TIỀN THÔNG MINH - XỬ LÝ ĐA ĐỊNH DẠNG (PHIÊN BẢN HOÀN CHỈNH)
    const parsePrice = (text: string): number => {
        // 1. Dọn dẹp sơ bộ: thay ':' thành '.', xóa ký tự tiền tệ, khoảng trắng...
        let cleanText = text.replace(':', '.').replace(/[$\s€VNDđ]/g, '');

        const lastDot = cleanText.lastIndexOf('.');
        const lastComma = cleanText.lastIndexOf(',');

        // 2. Logic xác định dấu thập phân
        // Trường hợp 1: Dấu phẩy là thập phân (kiểu VN/Châu Âu, ví dụ: "1.234,56")
        if (lastComma > lastDot) {
            // Xóa hết dấu chấm (phân cách hàng nghìn), rồi thay dấu phẩy bằng dấu chấm
            cleanText = cleanText.replace(/\./g, '').replace(',', '.');
        } 
        // Trường hợp 2: Dấu chấm là thập phân (kiểu Mỹ, ví dụ: "1,234.56")
        // Hoặc có nhiều dấu chấm (kiểu VN, ví dụ: "50.000" -> không có phần thập phân)
        else {
             // Nếu có nhiều hơn 1 dấu chấm, chúng là dấu phân cách hàng nghìn -> xóa hết
            if ((cleanText.match(/\./g) || []).length > 1) {
                 cleanText = cleanText.replace(/\./g, '');
            }
            // Xóa hết dấu phẩy (phân cách hàng nghìn)
            cleanText = cleanText.replace(/,/g, '');
        }
        
        const price = parseFloat(cleanText);
        return isNaN(price) ? 0 : price;
    }

    const isPrice = (field: any): boolean => {
        const isRightSide = field.boundingPoly.vertices[0].x > imageWidth * 0.5;
        // Chỉ cần có số là đủ, hàm parsePrice sẽ xử lý phần còn lại
        const containsNumber = /\d/.test(field.inferText);
        return isRightSide && containsNumber;
    };

    const itemRegionFields = fields.filter((field: any) => 
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
                const price = parsePrice(priceField.inferText);
                
                if (itemName && /[a-zA-Z]/.test(itemName) && !/^\#\d+$/.test(itemName)) {
                    items.push({ name: itemName, price });
                }
            }
        }
    }
    const finalItems = Array.from(new Set(items.map((item: any) => JSON.stringify(item))))
                           .map((str: string) => JSON.parse(str));
    console.log("DEBUG 6: Items cuối cùng tìm được:", finalItems);                   
    
    const total = finalItems.reduce((sum: number, item: any) => sum + item.price, 0);
    // Làm tròn tổng đến 2 chữ số thập phân
    const finalTotal = Math.round(total * 100) / 100;

    const dateRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
    const dateField = fields.find((f: any) => dateRegex.test(f.inferText));
    const date = dateField ? dateField.inferText.match(dateRegex)![0] : 'N/A';
    
    const headerFields = fields.filter((f:any) => headerEndY === 0 || f.boundingPoly.vertices[2].y < headerEndY);
    const merchant = headerFields.find((f: any) => /[a-zA-Z]/.test(f.inferText) && !f.inferText.includes('*'))?.inferText || "Không rõ";

    return {
        merchant,
        date,
        total: finalTotal,
        items: finalItems,
        raw: ocrData 
    };
}

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