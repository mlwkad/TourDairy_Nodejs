/**
 * 发布内容控制器
 * 处理与发布内容相关的API请求
 */
const { v4: uuidv4 } = require('uuid');
const releaseModel = require('../models/releaseModel');
const userModel = require('../models/userModel');

const releaseController = {
    /**
     * 获取所有发布内容接口
     * @param {Object} req.query - 查询参数
     * @param {number} req.query.limit - 限制条数，默认为50
     * @param {number} req.query.offset - 偏移量，默认为0
     * @param {string} req.query.state - 审核状态，默认为'resolve'
     * @returns {Array} - 发布内容列表
     */
    getAllReleases: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const state = req.query.state || 'resolve';

            // 参数验证
            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'limit参数必须在1-100之间'
                });
            }

            if (offset < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'offset参数不能为负数'
                });
            }

            if (!['wait', 'resolve', 'reject'].includes(state)) {
                return res.status(400).json({
                    success: false,
                    message: 'state参数必须为wait、resolve或reject'
                });
            }

            // 获取所有发布内容
            const releases = await releaseModel.getAllReleases(limit, offset, state);

            res.status(200).json({
                success: true,
                message: '获取发布内容列表成功',
                data: {
                    releases,
                    pagination: {
                        limit,
                        offset,
                        total: releases.length // 此处仅返回当前页面的数量，实际应返回总数
                    }
                }
            });
        } catch (error) {
            console.error('获取发布内容列表失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 根据ID获取发布内容详情接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.releaseID - 发布内容ID
     * @returns {Object} - 发布内容详情
     */
    getReleaseByID: async (req, res) => {
        try {
            const { releaseID } = req.params;

            // 参数验证
            if (!releaseID) {
                return res.status(400).json({
                    success: false,
                    message: '发布内容ID不能为空'
                });
            }

            // 获取发布内容详情
            const release = await releaseModel.getReleaseByID(releaseID);
            if (!release) {
                return res.status(404).json({
                    success: false,
                    message: '发布内容不存在'
                });
            }

            res.status(200).json({
                success: true,
                message: '获取发布内容详情成功',
                data: release
            });
        } catch (error) {
            console.error('获取发布内容详情失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 创建发布内容接口
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userID - 用户ID
     * @param {string} req.body.title - 标题
     * @param {number} req.body.playTime - 游玩时间（分钟）
     * @param {number} req.body.money - 费用
     * @param {number} req.body.personNum - 人数
     * @param {string} req.body.content - 内容描述
     * @param {Array} req.body.pictures - 图片URL数组 (可选)
     * @param {Array} req.body.videos - 视频URL数组 (可选)
     * @param {string} req.body.cover - 视频封面URL (可选)
     * @param {string} req.body.location - 位置
     * @returns {Object} - 创建的发布内容
     */
    createRelease: async (req, res) => {
        try {
            const {
                userID,
                title,
                playTime,
                money,
                personNum,
                content,
                pictures,
                videos,
                cover,
                location
            } = req.body;

            // 参数验证
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID不能为空'
                });
            }

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: '标题不能为空'
                });
            }

            if (playTime === undefined || money === undefined || personNum === undefined) {
                return res.status(400).json({
                    success: false,
                    message: '游玩时间、费用和人数不能为空'
                });
            }

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: '内容描述不能为空'
                });
            }

            if (!location) {
                return res.status(400).json({
                    success: false,
                    message: '位置不能为空'
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

            // 生成唯一的发布内容ID
            const releaseID = uuidv4();

            // 创建发布内容
            const newRelease = await releaseModel.createRelease({
                releaseID,
                userID,
                title,
                playTime: parseInt(playTime),
                money: parseFloat(money),
                personNum: parseInt(personNum),
                content,
                pictures: pictures || [],
                videos: videos || [],
                cover,
                location
            });

            // 将releaseID添加到用户的release数组
            await userModel.addReleaseToUser(userID, releaseID);

            res.status(201).json({
                success: true,
                message: '创建发布内容成功',
                data: newRelease
            });
        } catch (error) {
            console.error('创建发布内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 更新发布内容接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.releaseID - 发布内容ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userID - 用户ID (用于权限验证)
     * @param {string} req.body.title - 标题 (可选)
     * @param {number} req.body.playTime - 游玩时间（分钟）(可选)
     * @param {number} req.body.money - 费用 (可选)
     * @param {number} req.body.personNum - 人数 (可选)
     * @param {string} req.body.content - 内容描述 (可选)
     * @param {Array} req.body.pictures - 图片URL数组 (可选)
     * @param {Array} req.body.videos - 视频URL数组 (可选)
     * @param {string} req.body.cover - 视频封面URL (可选)
     * @param {string} req.body.location - 位置 (可选)
     * @returns {Object} - 更新后的发布内容
     */
    updateRelease: async (req, res) => {
        try {
            const { releaseID } = req.params;
            const {
                userID, // 用于权限验证
                title,
                playTime,
                money,
                personNum,
                content,
                pictures,
                videos,
                cover,
                location
            } = req.body;

            // 参数验证
            if (!releaseID) {
                return res.status(400).json({
                    success: false,
                    message: '发布内容ID不能为空'
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

            // 检查用户是否有权限更新
            if (userID && release.userID !== userID) {
                return res.status(403).json({
                    success: false,
                    message: '没有权限更新该发布内容'
                });
            }

            // 检查至少提供一个要更新的字段
            if (
                title === undefined &&
                playTime === undefined &&
                money === undefined &&
                personNum === undefined &&
                content === undefined &&
                pictures === undefined &&
                videos === undefined &&
                cover === undefined &&
                location === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: '至少提供一个要更新的字段'
                });
            }

            // 构建更新数据
            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (playTime !== undefined) updateData.playTime = parseInt(playTime);
            if (money !== undefined) updateData.money = parseFloat(money);
            if (personNum !== undefined) updateData.personNum = parseInt(personNum);
            if (content !== undefined) updateData.content = content;
            if (pictures !== undefined) updateData.pictures = pictures;
            if (videos !== undefined) updateData.videos = videos;
            if (cover !== undefined) updateData.cover = cover;
            if (location !== undefined) updateData.location = location;

            // 用户编辑游记后，状态重置为待审核
            if (userID) {
                updateData.state = 'wait';
                updateData.reason = '待审核';
            }

            // 更新发布内容
            const updatedRelease = await releaseModel.updateRelease(releaseID, updateData);

            res.status(200).json({
                success: true,
                message: '更新发布内容成功',
                data: updatedRelease
            });
        } catch (error) {
            console.error('更新发布内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 更新游记审核状态接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.releaseID - 发布内容ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.state - 审核状态 'wait', 'resolve', 'reject'
     * @param {string} req.body.reason - 未通过原因（当状态为reject时必须提供）
     * @returns {Object} - 更新后的发布内容
     */
    updateReleaseState: async (req, res) => {
        try {
            const { releaseID } = req.params;
            const { state, reason } = req.body;

            // 参数验证
            if (!releaseID) {
                return res.status(400).json({
                    success: false,
                    message: '发布内容ID不能为空'
                });
            }

            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: '审核状态不能为空'
                });
            }

            if (!['wait', 'resolve', 'reject'].includes(state)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的审核状态值'
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

            // 当状态为reject时，必须提供reason
            if (state === 'reject' && (!reason || reason.trim() === '')) {
                return res.status(400).json({
                    success: false,
                    message: '拒绝时必须提供原因'
                });
            }

            // 更新发布内容状态
            const updatedRelease = await releaseModel.updateReleaseState(releaseID, state, reason || '');

            res.status(200).json({
                success: true,
                message: '更新游记审核状态成功',
                data: updatedRelease
            });
        } catch (error) {
            console.error('更新游记审核状态失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    },

    /**
     * 删除发布内容接口
     * @param {Object} req.params - 请求参数
     * @param {string} req.params.releaseID - 发布内容ID
     * @param {Object} req.body - 请求体
     * @param {string} req.body.userID - 用户ID
     * @returns {Object} - 成功消息
     */
    deleteRelease: async (req, res) => {
        try {
            const { releaseID } = req.params;
            const { userID } = req.body;

            // 参数验证
            if (!releaseID || !userID) {
                return res.status(400).json({
                    success: false,
                    message: '发布内容ID和用户ID不能为空'
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

            // 检查用户是否有权限删除
            if (release.userID !== userID) {
                return res.status(403).json({
                    success: false,
                    message: '没有权限删除该发布内容'
                });
            }

            // 删除发布内容
            await releaseModel.deleteRelease(releaseID);

            // 从用户的release数组中移除该发布内容ID
            await userModel.removeReleaseFromUser(userID, releaseID);

            res.status(200).json({
                success: true,
                message: '删除发布内容成功'
            });
        } catch (error) {
            console.error('删除发布内容失败:', error);
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
    getReleasesByUserID: async (req, res) => {
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

            // 获取用户发布的内容
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
     * 搜索发布内容接口
     * 通过用户名或作品标题搜索
     * @param {Object} req.query - 查询参数
     * @param {string} req.query.userName - 用户名（可选）
     * @param {string} req.query.title - 作品标题关键词（可选）
     * @param {string} req.query.state - 审核状态，默认为'resolve'
     * @returns {Array} - 搜索结果列表
     */
    searchReleases: async (req, res) => {
        try {
            // 从query或body中获取参数
            const userName = req.query.userName || req.body.userName;
            const title = req.query.title || req.body.title;
            const state = req.query.state || req.body.state || 'resolve';

            console.log(`[DEBUG] 搜索请求参数: userName="${userName}", title="${title}", state="${state}"`);

            // 参数验证 - 至少提供一个搜索条件
            if (!userName && !title) {
                return res.status(400).json({
                    success: false,
                    message: '请提供用户名或作品标题作为搜索条件'
                });
            }

            if (!['wait', 'resolve', 'reject'].includes(state)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的审核状态值'
                });
            }

            // 用于存储不同类型的搜索结果
            let userNameResults = [];
            let titleResults = [];
            let originalTitleResults = []; // 保存原始的标题搜索结果

            // 如果提供了用户名，模糊搜索用户名
            if (userName) {
                // 使用模糊搜索找到所有匹配的用户
                const matchedUsers = await userModel.searchUsersByName(userName);
                console.log(`[DEBUG] 匹配用户名的用户数量: ${matchedUsers.length}`);

                if (matchedUsers.length > 0) {
                    // 获取这些用户的ID
                    const userIDs = matchedUsers.map(user => user.userID);
                    console.log(`[DEBUG] 匹配用户的ID: ${userIDs.join(', ')}`);

                    // 获取这些用户发布的所有内容
                    userNameResults = await releaseModel.getReleasesByUserIDs(userIDs, state);
                    console.log(`[DEBUG] 匹配用户发布的内容数量: ${userNameResults.length}`);
                }
            }

            // 如果提供了标题，搜索标题中包含关键词的内容
            if (title) {
                originalTitleResults = await releaseModel.searchReleasesByTitle(title, state);
                console.log(`[DEBUG] 原始标题搜索结果数量: ${originalTitleResults.length}`);

                // 不再去重，保留原始搜索结果
                titleResults = originalTitleResults;
            }

            // 找出同时匹配用户名和标题的内容
            let bothResults = [];
            if (userNameResults.length > 0 && titleResults.length > 0) {
                const userNameReleaseIDs = userNameResults.map(item => item.releaseID);
                bothResults = titleResults.filter(item =>
                    userNameReleaseIDs.includes(item.releaseID)
                );
            }

            // 构建结果并添加来源标记
            const userNameResultsWithSource = userNameResults.map(item => ({
                ...item,
                matchSource: bothResults.some(r => r.releaseID === item.releaseID) ? ['userName', 'title'] : ['userName']
            }));

            const titleResultsWithSource = titleResults.map(item => ({
                ...item,
                matchSource: bothResults.some(r => r.releaseID === item.releaseID) ? ['userName', 'title'] : ['title']
            }));

            // 汇总所有不重复的结果
            // 注意：为避免重复，我们不直接合并 userNameResultsWithSource 和 titleResultsWithSource
            const uniqueReleaseIDs = new Set();
            const totalResults = [];

            userNameResultsWithSource.forEach(item => {
                if (!uniqueReleaseIDs.has(item.releaseID)) {
                    uniqueReleaseIDs.add(item.releaseID);
                    totalResults.push(item);
                }
            });

            titleResultsWithSource.forEach(item => {
                if (!uniqueReleaseIDs.has(item.releaseID)) {
                    uniqueReleaseIDs.add(item.releaseID);
                    totalResults.push(item);
                }
            });

            // 调试信息
            console.log(`[DEBUG] 最终结果统计:`);
            console.log(`[DEBUG] - 用户名匹配结果: ${userNameResultsWithSource.length}`);
            console.log(`[DEBUG] - 标题匹配结果: ${titleResultsWithSource.length}`);
            console.log(`[DEBUG] - 两者都匹配: ${bothResults.length}`);
            console.log(`[DEBUG] - 去重后总结果数: ${totalResults.length}`);

            res.status(200).json({
                success: true,
                message: totalResults.length > 0 ? '搜索发布内容成功' : '未找到符合条件的发布内容',
                data: {
                    byUserName: userNameResultsWithSource,
                    byTitle: titleResultsWithSource,
                    byBoth: bothResults.length, // 添加同时匹配两者的数量
                    total: totalResults.length
                }
            });
        } catch (error) {
            console.error('搜索发布内容失败:', error);
            res.status(500).json({
                success: false,
                message: '服务器错误',
                error: error.message
            });
        }
    }
};

module.exports = releaseController; 