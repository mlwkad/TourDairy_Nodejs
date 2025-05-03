/**
 * 上传路由
 * 配置文件上传相关的API路由
 */
const express = require('express');
const router = express.Router();
const { upload, processUploadedFiles } = require('../utils/upload');

/**
 * @route POST /api/upload
 * @desc 上传文件（图片/视频）
 * @access 公开
 * @param {Array} files - 要上传的文件
 * @returns {Object} 包含上传后文件URL的对象
 */
router.post('/upload', upload.array('files', 10), (req, res) => {
    try {
        // 检查是否有文件上传
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有上传任何文件'
            });
        }

        // 处理上传的文件
        const { pictures, videos } = processUploadedFiles(req);

        res.status(200).json({
            success: true,
            message: '文件上传成功',
            data: {
                pictures,
                videos,
                total: pictures.length + videos.length
            }
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({
            success: false,
            message: '文件上传失败',
            error: error.message
        });
    }
});

module.exports = router; 