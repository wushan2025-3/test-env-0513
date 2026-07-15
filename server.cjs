// 后端 Express，监听端口由 backend-runtime 的 start.js 接管（用户写的 8080 会被吞掉）
const express = require('express');

const app = express();
app.use(express.json());

app.get('/v3/files/hello_er.txt', (req, res) => res.json({ ok: true, runtime: 'two.anycast3.xxxtest.alicdn-test.com静态资源走efc！！！！' }));

app.get('/api/users/:id', (req, res) => {
  res.json({ user: req.params.id, source: 'express' });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

app.listen(8080, () => {
  console.log('user-listen-cb on 8080 (will be intercepted)');
});
