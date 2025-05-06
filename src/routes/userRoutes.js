/**
 * 用户路由
 * 配置用户相关的API路由
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * @route POST /api/checkLogin
 * @desc 用户登录
 * @access 公开
 * @param {string} userName - 用户名
 * @param {string} passWord - 密码
 * @returns {Object} 用户信息（不包含密码）
 */
router.post('/checkLogin', userController.checkLogin);

/**
 * @route POST /api/signUp
 * @desc 用户注册
 * @access 公开
 * @param {string} userName - 用户名
 * @param {string} passWord - 密码
 * @param {string} avatar - 头像URL (可选)
 * @returns {Object} 创建的用户信息（不包含密码）
 */
router.post('/signUp', userController.signUp);

/**
 * @route GET /api/user/:userID
 * @desc 获取用户信息
 * @access 公开
 * @param {string} userID - 用户ID
 * @returns {Object} 用户信息（不包含密码）
 */
router.get('/user/:userID', userController.getUserInfo);

/**
 * @route PUT /api/user/:userID
 * @desc 更新用户信息
 * @access 公开
 * @param {string} userID - 用户ID
 * @param {string} userName - 用户名 (可选)
 * @param {string} avatar - 头像URL (可选)
 * @returns {Object} 更新后的用户信息
 */
router.put('/user/:userID', userController.updateUserInfo);

/**
 * @route GET /api/user/:userID/releases
 * @desc 获取用户发布的内容列表
 * @access 公开
 * @param {string} userID - 用户ID
 * @returns {Array} 发布内容列表
 */
router.get('/user/:userID/releases', userController.getUserReleases);

/**
 * @route GET /api/user/:userID/liked
 * @desc 获取用户喜欢的内容列表
 * @access 公开
 * @param {string} userID - 用户ID
 * @returns {Array} 喜欢的内容列表
 */
router.get('/user/:userID/liked', userController.getUserLiked);

/**
 * @route POST /api/user/:userID/liked
 * @desc 添加喜欢的内容
 * @access 公开
 * @param {string} userID - 用户ID
 * @param {string} releaseID - 发布内容ID
 * @returns {Object} 成功消息
 */
router.post('/user/:userID/liked', userController.addLiked);

/**
 * @route DELETE /api/user/:userID/liked/:releaseID
 * @desc 移除喜欢的内容
 * @access 公开
 * @param {string} userID - 用户ID
 * @param {string} releaseID - 发布内容ID
 * @returns {Object} 成功消息
 */
router.delete('/user/:userID/liked/:releaseID', userController.removeLiked);

/**
 * @route POST /api/user/:userID/follow
 * @desc 关注用户
 * @access 公开
 * @param {string} userID - 当前用户ID
 * @param {string} followUserID - 要关注的用户ID
 * @returns {Object} 成功消息
 */
router.post('/user/:userID/follow', userController.followUser);

/**
 * @route DELETE /api/user/:userID/follow/:followUserID
 * @desc 取消关注用户
 * @access 公开
 * @param {string} userID - 当前用户ID
 * @param {string} followUserID - 要取消关注的用户ID
 * @returns {Object} 成功消息
 */
router.delete('/user/:userID/follow/:followUserID', userController.unfollowUser);

/**
 * @route GET /api/user/:userID/following
 * @desc 获取用户关注列表
 * @access 公开
 * @param {string} userID - 用户ID
 * @returns {Array} 关注的用户ID列表
 */
router.get('/user/:userID/following', userController.getUserFollowing);

module.exports = router; 