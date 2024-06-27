const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors'); // 导入cors包
const app = express();
const port = 3000;

app.use(cors()); // 使用cors中间件处理CORS问题
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));
app.use(bodyParser.json({limit: '50mb'}));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.originalUrl}`);
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const originalname = decodeURIComponent(file.originalname);
        cb(null, originalname);
    },
});
const upload = multer({storage});
app.post('/upload', upload.single('file'), (req, res) => {
    res.status(200).json({status: 0, msg: 'success'});
});

const uploadChunk = multer({storage: multer.memoryStorage()});
app.post('/upload-chunk', uploadChunk.single('file'), (req, res) => {
    const file = req.file.buffer;
    let {start, end, filename, size} = req.body;
    start = +start;
    end = +end;
    size = +size;
    filename = decodeURIComponent(filename);
    const chunkPath = path.join(__dirname, 'uploads', filename);
    // 将分块数据写入文件
    const stream = fs.createWriteStream(chunkPath, {flags: start === 0 ? 'w' : 'a'});
    stream.write(file, 'base64');
    stream.end();
    if (end === size - 1) {
        res.json({success: true, message: '分块上传成功'});
    } else {
        res.json({success: true, message: '分块上传继续'});
    }
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
