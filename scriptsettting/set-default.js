const axios = require('axios');

// 1. ใส่ Token เดิมของคุณ
const CHANNEL_ACCESS_TOKEN = '+usRCeB64yU5KUYJg8sXqqdczM0Cas7b/UvNMTpZm/D3yxVQP5q8jD8dI5SiAkFmbuwTHb47ln0Eru34yupwTyLlwpaa8soRqhCXaV7fcUbD6n8Gzi6V1C3Jp3QNg0aacUi9EeQ3kXHzBZ6zQeLj/AdB04t89/1O/w1cDnyilFU=';

// 2. ใส่ ID ของ Guest Menu (เอามาจากผลลัพธ์ที่รันผ่านเมื่อกี้)
const GUEST_MENU_ID = 'richmenu-ab71045aa637fec9929e74eebb3f281c'; 

async function setDefaultRichMenu() {
    try {
        await axios.post(
            `https://api.line.me/v2/bot/user/all/richmenu/${GUEST_MENU_ID}`,
            {},
            {
                headers: { 
                    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log('✅ ตั้งค่าเมนูเริ่มต้นสำเร็จ!');
        console.log('ตอนนี้ทุกคนที่เปิดเข้าแชท จะเห็นเมนู Guest เป็นอันแรกครับ');
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

setDefaultRichMenu();