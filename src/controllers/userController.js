/**
 * 用户控制器
 * 处理与用户相关的API请求
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const releaseModel = require('../models/releaseModel');

const userController = {
    /**
     * 登录接口
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userName - 用户名
     * @param {string} req.body.passWord - 密码
     * @returns {Object} - 用户信息（不包含密码）
     */
    checkLogin: async (req, res) => {
        try {
            const { userName, passWord } = req.body;

            // 参数验证
            if (!userName || !passWord) {
                return res.status(400).json({
                    success: false,
                    message: '用户名和密码不能为空'
                });
            }

            // 查找用户
            const user = await userModel.findByUserName(userName);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 验证密码
            const isPasswordValid = await bcrypt.compare(passWord, user.passWord);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: '密码错误'
                });
            }

            // 成功登录后，返回用户信息（不包含密码）
            const userInfo = { ...user };
            delete userInfo.passWord;

            res.status(200).json({
                success: true,
                message: '登录成功',
                data: userInfo
            });
        } catch (error) {
            console.error('登录失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 注册接口
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userName - 用户名
     * @param {string} req.body.passWord - 密码
     * @param {string} req.body.avatar - 头像URL (可选)
     * @returns {Object} - 创建的用户信息（不包含密码）
     */
    signUp: async (req, res) => {
        try {
            const { userName, passWord, avatar } = req.body;

            // 参数验证
            if (!userName || !passWord) {
                return res.status(400).json({
                    success: false,
                    message: '用户名和密码不能为空'
                });
            }

            // 用户名格式验证：允许中文、字母和数字的组合
            const usernameRegex = /^[\u4e00-\u9fa5A-Za-z0-9]{2,20}$/;
            if (!usernameRegex.test(userName)) {
                return res.status(400).json({
                    success: false,
                    message: '用户名可以包含中文、字母和数字，长度为2-20个字符'
                });
            }

            // 密码强度验证：至少6位，包含字母和数字
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
            if (!passwordRegex.test(passWord)) {
                return res.status(400).json({
                    success: false,
                    message: '密码必须至少6位，且包含字母和数字'
                });
            }

            // 检查用户名是否已存在
            const existingUser = await userModel.findByUserName(userName);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已存在'
                });
            }

            // 生成唯一的用户ID
            const userID = uuidv4();

            // 创建新用户
            const newUser = await userModel.createUser({
                userID,
                userName,
                passWord,
                avatar
            });

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: newUser
            });
        } catch (error) {
            console.error('注册失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 获取用户信息接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @returns {Object} - 用户信息（不包含密码）
     */
    getUserInfo: async (req, res) => {
        try {
            const { userID } = req.params;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            // 查找用户
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 返回用户信息（不包含密码）
            const userInfo = { ...user };
            delete userInfo.passWord;

            res.status(200).json({
                success: true,
                message: '获取用户信息成功',
                data: userInfo
            });
        } catch (error) {
            console.error('获取用户信息失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 更新用户信息接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userName - 新用户名 (可选)
     * @param {string} req.body.avatar - 新头像URL (可选)
     * @returns {Object} - 更新后的用户信息
     */
    updateUserInfo: async (req, res) => {
        try {
            const { userID } = req.params;
            const { userName, avatar } = req.body;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            if (!userName && !avatar) {
                return res.status(400).json({
                    success: false,
                    message: '至少提供一个要更新的字段'
                });
            }

            // 如果要更新用户名，先检查格式
            if (userName) {
                const usernameRegex = /^[\u4e00-\u9fa5A-Za-z0-9]{2,20}$/;
                if (!usernameRegex.test(userName)) {
                    return res.status(400).json({
                        success: false,
                        message: '用户名可以包含中文、字母和数字，长度为2-20个字符'
                    });
                }

                // 检查用户名是否已被其他用户使用
                const existingUser = await userModel.findByUserName(userName);
                if (existingUser && existingUser.userID !== userID) {
                    return res.status(409).json({
                        success: false,
                        message: '用户名已被使用'
                    });
                }
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 更新用户信息
            const updateData = {};
            if (userName) updateData.userName = userName;
            if (avatar) updateData.avatar = avatar;

            const updatedUser = await userModel.updateUser(userID, updateData);

            res.status(200).json({
                success: true,
                message: '更新用户信息成功',
                data: updatedUser
            });
        } catch (error) {
            console.error('更新用户信息失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 获取用户发布的内容列表接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @returns {Array} - 发布内容列表
     */
    getUserReleases: async (req, res) => {
        try {
            const { userID } = req.params;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 获取用户发布的内容列表
            const releases = await releaseModel.getReleasesByUserID(userID);

            res.status(200).json({
                success: true,
                message: '获取用户发布内容成功',
                data: releases
            });
        } catch (error) {
            console.error('获取用户发布内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 获取用户喜欢的内容列表接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @returns {Array} - 喜欢的内容列表
     */
    getUserLiked: async (req, res) => {
        try {
            const { userID } = req.params;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 获取用户喜欢的内容ID列表
            const likedIDs = JSON.parse(user.liked);

            // 根据ID列表批量获取内容详情
            const likedReleases = await releaseModel.getReleasesByIDs(likedIDs);

            res.status(200).json({
                success: true,
                message: '获取用户喜欢内容成功',
                data: likedReleases
            });
        } catch (error) {
            console.error('获取用户喜欢内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 添加喜欢的内容接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.releaseID - 发布内容ID
     * @returns {Object} - 成功消息
     */
    addLiked: async (req, res) => {
        try {
            const { userID } = req.params;
            const { releaseID } = req.body;

            // 参数验证
            if (!userID || !releaseID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和发布内容ID不能为空'
                });
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 检查发布内容是否存在
            const release = await releaseModel.getReleaseByID(releaseID);
            if (!release) {
                return res.status(404).json({
                    success: false,
                    message: '发布内容不存在'
                });
            }

            // 检查用户是否已经收藏过该内容
            const likedList = JSON.parse(user.liked || '[]');
            if (likedList.includes(releaseID)) {
                return res.status(200).json({
                    success: true,
                    message: '您已经收藏过了'
                });
            }

            // 添加发布内容ID到用户的liked数组
            await userModel.addLikedToUser(userID, releaseID);

            res.status(200).json({
                success: true,
                message: '添加喜欢内容成功'
            });
        } catch (error) {
            console.error('添加喜欢内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 移除喜欢的内容接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @param {string} req.params.releaseID - 发布内容ID
     * @returns {Object} - 成功消息
     */
    removeLiked: async (req, res) => {
        try {
            const { userID, releaseID } = req.params;

            // 参数验证
            if (!userID || !releaseID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和发布内容ID不能为空'
                });
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 从用户的liked数组中移除发布内容ID
            await userModel.removeLikedFromUser(userID, releaseID);

            res.status(200).json({
                success: true,
                message: '移除喜欢内容成功'
            });
        } catch (error) {
            console.error('移除喜欢内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 关注用户接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 当前用户ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.followUserID - 要关注的用户ID
     * @returns {Object} - 成功消息
     */
    followUser: async (req, res) => {
        try {
            const { userID } = req.params;
            const { followUserID } = req.body;

            // 参数验证
            if (!userID || !followUserID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和要关注的用户ID不能为空'
                });
            }

            // 检查不能关注自己
            if (userID === followUserID) {
                return res.status(400).json({
                    success: false,
                    message: '不能关注自己'
                });
            }

            // 检查当前用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 检查要关注的用户是否存在
            const followUser = await userModel.findByUserID(followUserID);
            if (!followUser) {
                return res.status(404).json({
                    success: false,
                    message: '要关注的用户不存在'
                });
            }

            // 添加关注
            await userModel.followUser(userID, followUserID);

            res.status(200).json({
                success: true,
                message: '关注成功'
            });
        } catch (error) {
            console.error('关注用户失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 取消关注用户接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 当前用户ID
     * @param {string} req.params.followUserID - 要取消关注的用户ID
     * @returns {Object} - 成功消息
     */
    unfollowUser: async (req, res) => {
        try {
            const { userID, followUserID } = req.params;

            // 参数验证
            if (!userID || !followUserID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和要取消关注的用户ID不能为空'
                });
            }

            // 检查当前用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 取消关注
            await userModel.unfollowUser(userID, followUserID);

            res.status(200).json({
                success: true,
                message: '取消关注成功'
            });
        } catch (error) {
            console.error('取消关注用户失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 获取用户关注列表接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.userID - 用户ID
     * @returns {Array} - 关注的用户ID列表
     */
    getUserFollowing: async (req, res) => {
        try {
            const { userID } = req.params;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            // 检查用户是否存在
            const user = await userModel.findByUserID(userID);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            // 获取关注列表
            const followingList = await userModel.getUserFollowing(userID);

            res.status(200).json({
                success: true,
                message: '获取关注列表成功',
                data: followingList
            });
        } catch (error) {
            console.error('获取关注列表失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    }
};

module.exports = userController; 