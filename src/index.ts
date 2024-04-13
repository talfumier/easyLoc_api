import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello NOD Readers!');
});

app.listen(port, () => {
return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});