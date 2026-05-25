const https = require('https');

const data = JSON.stringify({ email: 'abhi@gmail.com', password: '123456' });

const options = {
  hostname: 'expense-tracker-a7hw.onrender.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://expense-tracker-sigma-five-18.vercel.app',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('CORS Header:', res.headers['access-control-allow-origin']);
    console.log('Response:', body);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
