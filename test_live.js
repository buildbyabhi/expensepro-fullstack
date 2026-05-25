const https = require('https');

const data = JSON.stringify({ name: 'Test User', email: 'test123@gmail.com', password: '123456' });

const options = {
  hostname: 'expense-tracker-a7hw.onrender.com',
  path: '/api/auth/register',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
