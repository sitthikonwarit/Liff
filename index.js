const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Node.js LIFF Server is running!');
});

app.post('/save-data', async (req, res) => {
  const userData = req.body;
  console.log('ได้รับข้อมูลจาก LIFF:', userData.displayName);

  // *** ส่วนที่เพิ่ม: ส่งต่อไป Google Sheet ***
  
  // 1. ใส่ลิงก์ Google Script ที่คุณ Copy มาเมื่อกี้ ตรงนี้! 👇
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_0sxwA7pW4wXggQpY7uyNHzOYfb5iJ5szHtSky3Zw1PPdyXktPtlcKI_ewlSCJV4-/exec'; 

  try {
    // 2. ใช้ fetch ยิงข้อมูลไปหา Google
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData) // ส่งข้อมูล user ไป
    });

    const result = await response.json();
    console.log('บันทึกลง Sheet สำเร็จ:', result);

    // 3. ตอบกลับไปหาหน้าเว็บ LIFF ว่าโอเค
    res.json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อยแล้ว!' });

  } catch (error) {
    console.error('Error saving to sheet:', error);
    res.json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});