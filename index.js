const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // ใช้ยิงไปหา Google Script
const app = express();

// เพิ่มขนาด Body ให้รองรับการอัปโหลดไฟล์รูป/PDF (สำคัญมาก ไม่งั้นส่งรูปไม่ไป)
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(express.static('public'));

// *** ใส่ URL Google Script ของคุณที่นี่ ***
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxT7TtEAbXeoGGfPtlAIhhc7jo4B7Vs3xAPv9Lm1lJ7npprUjK28Yfx4kHCUQ4spLhzBA/exec'; // ใส่ URL ของคุณ

// 1. API สำหรับหน้าเว็บเรียกเช็คเบอร์
app.post('/api/check-phone', async (req, res) => {
    try {
        const { phone } = req.body;
        
        // ยิงไปถาม Google Script
        const response = await axios.post(GAS_URL, {
            action: 'check_phone',
            phone: phone
        });

        // ส่งผลลัพธ์กลับไปหน้าเว็บ (true/false)
        res.json(response.data); 
    } catch (error) {
        console.error("Error checking phone:", error.message);
        res.status(500).json({ error: 'Check failed' });
    }
});

// 2. API สำหรับหน้าเว็บกดบันทึก
app.post('/api/save-tenant', async (req, res) => {
    try {
        const allData = req.body; // รับข้อมูลทั้งหมดจากหน้าเว็บ

        // ยิงไปสั่ง Google Script ให้บันทึก
        const response = await axios.post(GAS_URL, {
            action: 'save_tenant',
            payload: allData // ส่งข้อมูลก้อนใหญ่ไปให้ Google
        });

        // ส่งข้อมูลผู้เช่าใหม่ที่ได้จาก Google กลับไปให้หน้าเว็บ
        res.json(response.data); 

    } catch (error) {
        console.error("Error saving tenant:", error.message);
        res.status(500).json({ success: false, message: 'Save failed' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});