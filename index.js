const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // แนะนำให้ลง npm install axios ถ้ายังไม่มี
const app = express();

// เพิ่มขนาด Body ให้รองรับการอัปโหลดไฟล์รูป/PDF
app.use(bodyParser.json({ limit: '50mb' })); 

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxT7TtEAbXeoGGfPtlAIhhc7jo4B7Vs3xAPv9Lm1lJ7npprUjK28Yfx4kHCUQ4spLhzBA/exec'; // ใส่ URL ของคุณ

// 1. API เช็คเบอร์โทร
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
        console.error(error);
        res.status(500).json({ error: 'Check failed' });
    }
});

// 2. API บันทึกข้อมูล
app.post('/api/save-tenant', async (req, res) => {
    try {
        // รับข้อมูลทั้งหมดจากหน้าเว็บ
        const allData = req.body; 

        // ยิงไปสั่ง Google Script ให้บันทึก
        const response = await axios.post(GAS_URL, {
            action: 'save_tenant',
            payload: allData // ส่งข้อมูลก้อนใหญ่ไป
        });

        // ส่งข้อมูลผู้เช่าใหม่ที่ได้จาก Google กลับไปให้หน้าเว็บ (เพื่อทำ DOM Update)
        res.json(response.data); 

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Save failed' });
    }
});