const http = require('http');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  console.log(`Incoming request: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Email server is running', path: req.url }));
    return;
  }
  
  if (req.method === 'POST' && (req.url === '/send' || req.url === '/api/send' || req.url.endsWith('/send'))) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, verificationLink } = data;
        
        if (!email || !verificationLink) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing fields' }));
          return;
        }
        
        const mailOptions = {
          from: '"Real Pain Tattoo Studio" <admin@realpaintattoo.ink>',
          to: email,
          subject: 'Verify Your Newsletter Subscription - Real Pain Tattoo Studio',
          html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
<h1 style="color: white; margin: 0;">REAL PAIN TATTOO STUDIO</h1>
<p style="color: #ccc;">Newsletter Subscription</p>
</div>
<div style="background: white; padding: 40px; border: 1px solid #eee;">
<h2>Almost There!</h2>
<p>Thank you for subscribing! Please verify your email by clicking the button below:</p>
<div style="text-align: center; margin: 30px 0;">
<a href="${verificationLink}" style="display: inline-block; background: #1a1a1a; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">Verify Email Address</a>
</div>
<p style="color: #666; font-size: 14px;">Or copy this link: ${verificationLink}</p>
<p style="color: #666; font-size: 12px; margin-top: 40px;">If you didn't subscribe, you can ignore this email.</p>
</div>
<div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
<p>© ${new Date().getFullYear()} Real Pain Tattoo Studio</p>
</div>
</body>
</html>
`
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Email sent' }));
          }
        });
        
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Email server running on http://${HOST}:${PORT}`);
});
