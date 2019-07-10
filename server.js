const path = require('path');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const upload = require('./upload');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const app = express();
const https = require('https');
const hskey = fs.readFileSync('privkey.pem', 'utf8');
const hscert = fs.readFileSync('cert.pem', 'utf8');
const hschain = fs.readFileSync('fullchain.pem', 'utf8');
const creds = {
  key: hskey,
  cert: hscert,
  ca: [hschain]
};
const port = 14579;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
  
app.use(express.static(__dirname + "/"));
app.use(fileUpload());

app.post('/upload', jsonParser, upload.uploadFile);
app.post('/list', jsonParser, upload.listFiles);
app.post('/download-all', jsonParser, upload.downloadAll);

app.get('/', (req, res) => res.sendFile(path.join(__dirname + '/app/index.html')));

const httpsServer = https.createServer(creds, app);
httpsServer.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});