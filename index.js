
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
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw0JJcouFThfIj6a9c48YVnfMMuU0etBDR4pRuMUPwoNM9KIYXgofEIbEVOXRB4yNpSPg/exec'; // ใส่ URL ของคุณ

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

        if (response.data.linked) {
            console.log(`User ${userId} is already linked. Switching to Member Menu...`);
            await linkRichMenu(userId, MEMBER_MENU_ID);
        }

        res.json(response.data);
    } catch (error) {
        console.error("Error checking status:", error.message);
        res.status(500).json({ linked: false });
    }
});

const LINE_CHANNEL_ACCESS_TOKEN = '+usRCeB64yU5KUYJg8sXqqdczM0Cas7b/UvNMTpZm/D3yxVQP5q8jD8dI5SiAkFmbuwTHb47ln0Eru34yupwTyLlwpaa8soRqhCXaV7fcUbD6n8Gzi6V1C3Jp3QNg0aacUi9EeQ3kXHzBZ6zQeLj/AdB04t89/1O/w1cDnyilFU='; // อันเดิมกับข้างบน
const GUEST_MENU_ID = 'richmenu-ab71045aa637fec9929e74eebb3f281c'; // ใส่ ID ที่ได้จากขั้นตอนที่ 1 (Guest)
const MEMBER_MENU_ID = 'richmenu-c363ce9522a19d1f6234a021a3a5edb5'; // ใส่ ID ที่ได้จากขั้นตอนที่ 1 (Member)


async function linkRichMenu(userId, richMenuId) {
    try {
        await axios.post(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {}, {
            headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
        });
        console.log(`Switched menu for ${userId} to ${richMenuId}`);
    } catch (error) {
        console.error('Error switching rich menu:', error.message);
    }
}

app.post('/api/verify-line-user', async (req, res) => {
    try {
        const { userId, displayName, pictureUrl, phone } = req.body;

        if (!userId || !phone) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
        }

        // 1. บันทึกลง Google Sheet (เหมือนเดิม)
        const response = await axios.post(GAS_URL, {
            action: 'verify_and_link',
            userId: userId,
            displayName: displayName,
            pictureUrl: pictureUrl,
            phone: phone
        });

        if (response.data.success) {
            // *** 2. เพิ่มจุดนี้: ถ้าบันทึกสำเร็จ -> สั่งเปลี่ยน Rich Menu เป็น Member ***
            await linkRichMenu(userId, MEMBER_MENU_ID);

            // ส่ง Socket แจ้งเตือน Admin (เหมือนเดิม)
            console.log(`User Linked: ${phone} -> Sending signal to Admin...`);
            io.emit('server-update-tenant', {
                tenantId: response.data.tenant.id, 
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