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

  
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3nT30MC0IrUV00TXPK4DDghX2D3H7uTdYC9vBrJ66ZFfpfq9HgHn4o8ndpwUEiXWq/exec'; 

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData) /
    });

    const result = await response.json();
    console.log('บันทึกลง Sheet สำเร็จ:', result);

    res.json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อยแล้ว!' });

  } catch (error) {
    console.error('Error saving to sheet:', error);
    res.json({ status: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
  }
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});