const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// ตั้งค่าให้รับข้อมูล JSON ได้
app.use(bodyParser.json());
app.use(express.static('public')); // ให้เข้าถึงไฟล์ในโฟลเดอร์ public ได้

// Route หลักสำหรับเทสต์ว่า Server ทำงานไหม
app.get('/', (req, res) => {
  res.send('Node.js LIFF Server is running!');
});

// Route สำหรับรับข้อมูลจาก LIFF
app.post('/save-data', (req, res) => {
  const userData = req.body;
  
  console.log('ได้รับข้อมูลลูกค้า:', userData);
  
  // *** ตรงนี้คือจุดที่เอาไปบันทึกลง Database หรือ Google Sheets ต่อไป ***
  // เบื้องต้นให้ส่งกลับไปบอกว่า OK ก่อน
  
  res.json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อย (ดูใน Server Log)' });
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});