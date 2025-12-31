const axios = require('axios');
const fs = require('fs');

// *** ใส่ Channel Access Token ของคุณ (จาก LINE Developers > Messaging API) ***
const CHANNEL_ACCESS_TOKEN = '+usRCeB64yU5KUYJg8sXqqdczM0Cas7b/UvNMTpZm/D3yxVQP5q8jD8dI5SiAkFmbuwTHb47ln0Eru34yupwTyLlwpaa8soRqhCXaV7fcUbD6n8Gzi6V1C3Jp3QNg0aacUi9EeQ3kXHzBZ6zQeLj/AdB04t89/1O/w1cDnyilFU=';

// *** ใส่ LIFF URL หน้าลงทะเบียนของคุณ ***
const LIFF_LOGIN_URL = 'https://liff.line.me/2008797986-0wkAxTaV'; 

async function createRichMenu(name, chatBarText, imagePath, areas) {
    try {
        // 1. สร้าง Object ของ Rich Menu
        const menuData = {
            size: { width: 2500, height: 1686 },
            selected: true,
            name: name,
            chatBarText: chatBarText,
            areas: areas
        };

        const resCreate = await axios.post('https://api.line.me/v2/bot/richmenu', menuData, {
            headers: { 
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const richMenuId = resCreate.data.richMenuId;
        console.log(`✅ สร้างเมนู ${name} สำเร็จ! ID: ${richMenuId}`);

        // 2. อัปโหลดรูปภาพ
        const imageBuffer = fs.readFileSync(imagePath);
        await axios.post(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, imageBuffer, {
            headers: {
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'image/png' // หรือ image/jpeg ตามไฟล์รูป
            }
        });
        console.log(`   └─ อัปโหลดรูปสำเร็จ!`);

        return richMenuId;

    } catch (error) {
        console.error(`❌ Error creating ${name}:`, error.response ? error.response.data : error.message);
    }
}

async function main() {
    // --- 1. สร้างเมนู GUEST (1 บน, 3 ล่าง) ---
    // เตรียม Layout (x, y, กว้าง, สูง)
    const guestAreas = [
        {   // A: ปุ่มใหญ่ด้านบน -> เปิด LIFF Login
            bounds: { x: 0, y: 0, width: 2500, height: 843 },
            action: { type: 'uri', uri: LIFF_LOGIN_URL }
        },
        {   // B: ล่างซ้าย -> ข้อความ
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: 'message', text: 'ดูห้องว่าง' }
        },
        {   // C: ล่างกลาง -> ข้อความ
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: 'message', text: 'จองห้อง' }
        },
        {   // D: ล่างขวา -> ข้อความ
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'message', text: 'ติดต่อ' }
        }
    ];
    // ** อย่าลืมเตรียมไฟล์รูปชื่อ guest.png ไว้ในโฟลเดอร์เดียวกับไฟล์นี้ **
    const guestId = await createRichMenu('Guest Menu', 'เมนูผู้มาเยือน', 'guest.png', guestAreas);


    // --- 2. สร้างเมนู MEMBER (3x2) ---
    const w = 833; // ความกว้างช่อง
    const h = 843; // ความสูงช่อง
    const memberAreas = [
        { bounds: { x: 0, y: 0, width: w, height: h }, action: { type: 'message', text: 'ข้อมูลผู้เช่า' } },      // A
        { bounds: { x: w, y: 0, width: w, height: h }, action: { type: 'message', text: 'บิลเดือนนี้' } },      // B
        { bounds: { x: w*2, y: 0, width: w, height: h }, action: { type: 'message', text: 'ชำระเงิน' } },       // C
        { bounds: { x: 0, y: h, width: w, height: h }, action: { type: 'message', text: 'แจ้งซ่อม' } },         // D
        { bounds: { x: w, y: h, width: w, height: h }, action: { type: 'message', text: 'ติดต่อ' } },           // E
        { bounds: { x: w*2, y: h, width: w, height: h }, action: { type: 'message', text: 'เพิ่มเติม' } }       // F
    ];
    // ** อย่าลืมเตรียมไฟล์รูปชื่อ member.png ไว้ในโฟลเดอร์เดียวกับไฟล์นี้ **
    const memberId = await createRichMenu('Member Menu', 'เมนูสมาชิก', 'member.png', memberAreas);

    console.log('\n---------------------------------------------------');
    console.log('🎉 เสร็จสิ้น! ให้เอา ID ด้านล่างไปใส่ในไฟล์ server.js');
    console.log(`GUEST_MENU_ID = "${guestId}";`);
    console.log(`MEMBER_MENU_ID = "${memberId}";`);
    console.log('---------------------------------------------------');
}

main();