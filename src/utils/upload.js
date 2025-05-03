/**
 * 上传工具类
 * 处理文件上传相关功能
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录
const createUploadDirs = () => {
    const dirs = ['uploads', 'uploads/images', 'uploads/videos'];

    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, '../../', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

// 确保上传目录存在
createUploadDirs();

// 配置存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 根据文件类型选择不同的目录
        let uploadPath = path.join(__dirname, '../../uploads');

        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(uploadPath, 'images');
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(uploadPath, 'videos');
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名，避免覆盖
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 配置上传限制
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 限制100MB
        files: 10 // 一次最多上传10个文件
    }
});

module.exports = {
    upload,
    /**
     * 处理上传的文件URL
     * @param {Object} req - 请求对象
     * @returns {Object} 包含图片和视频URL的对象
     */
    processUploadedFiles: (req) => {
        const files = req.files;

        if (!files || files.length === 0) {
            return { pictures: [], videos: [] };
        }

        const baseUrl = `${req.protocol}://${req.get('host')}/`;
        const pictures = [];
        const videos = [];

        files.forEach(file => {
            const relativePath = path.relative(path.join(__dirname, '../../'), file.path).replace(/\\/g, '/');
            const fileUrl = baseUrl + relativePath;

            if (file.mimetype.startsWith('image/')) {
                pictures.push(fileUrl);
            } else if (file.mimetype.startsWith('video/')) {
                videos.push(fileUrl);
            }
        });

        return { pictures, videos };
    }
}; 