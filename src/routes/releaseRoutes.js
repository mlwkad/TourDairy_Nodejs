/**
 * 发布内容路由
 * 配置发布内容相关的API路由
 */
const express = require('express');
const router = express.Router();
const releaseController = require('../controllers/releaseController');

/**
 * @route GET /api/releases
 * @desc 获取所有发布内容
 * @access 公开
 * @param {number} limit - 限制条数，默认为50 (可选)
 * @param {number} offset - 偏移量，默认为0 (可选)
 * @returns {Array} 发布内容列表
 */
router.get('/releases', releaseController.getAllReleases);

/**
 * @route GET /api/release/:releaseID
 * @desc 根据ID获取发布内容详情
 * @access 公开
 * @param {string} releaseID - 发布内容ID
 * @returns {Object} 发布内容详情
 */
router.get('/release/:releaseID', releaseController.getReleaseByID);

/**
 * @route POST /api/release
 * @desc 创建发布内容
 * @access 公开
 * @param {string} userID - 用户ID
 * @param {string} title - 标题
 * @param {number} playTime - 游玩时间（分钟）
 * @param {number} money - 费用
 * @param {number} personNum - 人数
 * @param {string} content - 内容描述
 * @param {Array} pictures - 图片URL数组 (可选)
 * @param {Array} videos - 视频URL数组 (可选)
 * @param {string} location - 位置
 * @returns {Object} 创建的发布内容
 */
router.post('/release', releaseController.createRelease);

/**
 * @route PUT /api/release/:releaseID
 * @desc 更新发布内容
 * @access 公开
 * @param {string} releaseID - 发布内容ID
 * @param {string} title - 标题 (可选)
 * @param {number} playTime - 游玩时间（分钟）(可选)
 * @param {number} money - 费用 (可选)
 * @param {number} personNum - 人数 (可选)
 * @param {string} content - 内容描述 (可选)
 * @param {Array} pictures - 图片URL数组 (可选)
 * @param {Array} videos - 视频URL数组 (可选)
 * @param {string} location - 位置 (可选)
 * @returns {Object} 更新后的发布内容
 */
router.put('/release/:releaseID', releaseController.updateRelease);

/**
 * @route DELETE /api/release/:releaseID
 * @desc 删除发布内容
 * @access 公开
 * @param {string} releaseID - 发布内容ID
 * @param {string} userID - 用户ID
 * @returns {Object} 成功消息
 */
router.delete('/release/:releaseID', releaseController.deleteRelease);

/**
 * @route GET /api/releases/user/:userID
 * @desc 获取用户发布的内容列表
 * @access 公开
 * @param {string} userID - 用户ID
 * @returns {Array} 发布内容列表
 */
router.get('/releases/user/:userID', releaseController.getReleasesByUserID);

module.exports = router; 