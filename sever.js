// 后端 Express，监听端口由 backend-runtime 的 start.js 接管（用户写的 8080 会被吞掉）
const express = require('express');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, runtime: 'backend' }));

app.get('/api/users/:id', (req, res) => {
  res.json({ user: req.params.id, source: 'express' });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

app.listen(8080, () => {
  console.log('user-listen-cb on 8080 (will be intercepted)');
});
