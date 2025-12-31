
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http'); 
const { Server } = require("socket.io"); 

const app = express();

// สร้าง Server คู่กับ Socket
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(express.static('public'));

// *** ใส่ URL Google Script ของคุณที่นี่ ***
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw0fFs0j3XDGOMw1j2w0oRU-8eoZwjbtgk7bJVLJySTdrciDx3Hx0dBFuPIY_UpSRQT7w/exec'; // ใส่ URL ของคุณ

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

app.post('/api/liff-verify', async (req, res) => {
    try {
        const { userId, displayName, pictureUrl, phone } = req.body;

        if (!userId || !phone) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        // ยิงไปหา Google Script
        const response = await axios.post(GAS_URL, {
            action: 'verify_and_link',
            userId: userId,
            displayName: displayName,
            pictureUrl: pictureUrl,
            phone: phone
        });

        // ส่งผลลัพธ์จาก Google กลับไปให้ Frontend
        res.json(response.data); 
        
    } catch (error) {
        console.error("Error linking line user:", error.message);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    }
});

app.post('/api/check-line-status', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const response = await axios.post(GAS_URL, {
            action: 'check_line_status',
            userId: userId
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error checking status:", error.message);
        res.status(500).json({ linked: false });
    }
});

app.post('/api/verify-line-user', async (req, res) => {
    try {
        const { userId, displayName, pictureUrl, phone } = req.body;

        if (!userId || !phone) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        // ยิงไปหา Google Script (เพื่อบันทึกลง Sheet)
        const response = await axios.post(GAS_URL, {
            action: 'verify_and_link',
            userId: userId,
            displayName: displayName,
            pictureUrl: pictureUrl,
            phone: phone
        });

        // *** จุดสำคัญ: ถ้าบันทึกสำเร็จ ให้ส่งสัญญาณ Real-time ไปหาหน้า Admin ***
        if (response.data.success) {
            console.log(`User Linked: ${phone} -> Sending signal to Admin...`);
            
            // ส่ง event ชื่อ 'server-update-tenant' พร้อมข้อมูลผู้เช่าที่อัปเดตแล้ว
            io.emit('server-update-tenant', {
                tenantId: response.data.tenant.id, // ต้องแน่ใจว่า GAS ส่ง tenant.id กลับมาด้วย
                lineUserId: userId,
                success: true
            });
        }

        res.json(response.data); 
        
    } catch (error) {
        console.error("Error linking line user:", error.message);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ (Node)' });
    }
});

// ฟังการเชื่อมต่อ (Log ดูว่ามี Admin เข้ามาไหม)
io.on('connection', (socket) => {
    console.log('Admin Dashboard connected via Socket:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Admin Dashboard disconnected');
    });
});

// เปลี่ยนจาก app.listen เป็น server.listen
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});