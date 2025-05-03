/**
 * 用户模型
 * 处理与用户相关的数据库操作
 */
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const userModel = {
    /**
     * 初始化用户表
     * 创建存储用户信息的数据表
     * 
     * 表结构：
     * - userName: 用户名（字符串+数字）
     * - passWord: 密码（字符串+数字）
     * - userID: 用户ID（字符串）
     * - release: 发布的内容ID列表（TEXT格式存储JSON字符串）
     * - liked: 喜欢的内容ID列表（TEXT格式存储JSON字符串）
     * - avatar: 头像URL（字符串）
     */
    initTable: async () => {
        try {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userID VARCHAR(50) UNIQUE NOT NULL,
          userName VARCHAR(50) NOT NULL,
          passWord VARCHAR(100) NOT NULL,
          \`release\` TEXT,
          liked TEXT,
          avatar VARCHAR(255) DEFAULT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
            console.log('用户表初始化成功');

            // 检查是否需要插入测试数据
            const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
            if (rows[0].count === 0) {
                // 插入测试数据
                await userModel.insertTestData();
            }
        } catch (error) {
            console.error('初始化用户表失败:', error);
            throw error;
        }
    },

    /**
     * 插入测试数据
     */
    insertTestData: async () => {
        try {
            // 生成测试密码的哈希值
            const hashedPassword1 = await bcrypt.hash('password123', 10);
            const hashedPassword2 = await bcrypt.hash('password456', 10);

            // 插入测试用户
            await pool.query(`
        INSERT INTO users (userID, userName, passWord, \`release\`, liked, avatar) VALUES
        ('user1', 'testuser1', ?, '["release1", "release2"]', '["release3", "release4"]', 'https://example.com/avatar1.jpg'),
        ('user2', 'testuser2', ?, '["release3"]', '["release1", "release2"]', 'https://example.com/avatar2.jpg')
      `, [hashedPassword1, hashedPassword2]);

            console.log('测试用户数据已插入');
        } catch (error) {
            console.error('插入测试数据失败:', error);
            throw error;
        }
    },

    /**
     * 根据用户ID查找用户
     * @param {string} userID - 用户ID
     * @returns {Object|null} - 用户对象或null
     */
    findByUserID: async (userID) => {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE userID = ?',
                [userID]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('查找用户失败:', error);
            throw error;
        }
    },

    /**
     * 根据用户名查找用户
     * @param {string} userName - 用户名
     * @returns {Object|null} - 用户对象或null
     */
    findByUserName: async (userName) => {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM users WHERE userName = ?',
                [userName]
            );
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('查找用户失败:', error);
            throw error;
        }
    },

    /**
     * 创建新用户
     * @param {Object} userData - 用户数据
     * @returns {Object} - 创建的用户信息
     */
    createUser: async (userData) => {
        try {
            const { userID, userName, passWord, avatar } = userData;

            // 密码加密
            const hashedPassword = await bcrypt.hash(passWord, 10);

            // 插入新用户
            await pool.query(
                'INSERT INTO users (userID, userName, passWord, `release`, liked, avatar) VALUES (?, ?, ?, ?, ?, ?)',
                [userID, userName, hashedPassword, '[]', '[]', avatar || null]
            );

            // 返回创建的用户(不含密码)
            const user = await userModel.findByUserID(userID);
            delete user.passWord;
            return user;
        } catch (error) {
            console.error('创建用户失败:', error);
            throw error;
        }
    },

    /**
     * 更新用户信息
     * @param {string} userID - 用户ID
     * @param {Object} updateData - 要更新的数据
     * @returns {Object} - 更新后的用户信息
     */
    updateUser: async (userID, updateData) => {
        try {
            const allowedFields = ['userName', 'avatar'];
            const updates = [];
            const values = [];

            // 构建更新字段
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }

            if (updates.length === 0) {
                throw new Error('没有提供有效的更新字段');
            }

            // 添加userID作为条件
            values.push(userID);

            // 执行更新
            await pool.query(
                `UPDATE users SET ${updates.join(', ')} WHERE userID = ?`,
                values
            );

            // 返回更新后的用户
            const updatedUser = await userModel.findByUserID(userID);
            delete updatedUser.passWord;
            return updatedUser;
        } catch (error) {
            console.error('更新用户失败:', error);
            throw error;
        }
    },

    /**
     * 添加发布内容ID到用户的release数组
     * @param {string} userID - 用户ID
     * @param {string} releaseID - 发布内容ID
     * @returns {boolean} - 操作是否成功
     */
    addReleaseToUser: async (userID, releaseID) => {
        try {
            // 获取用户当前的release数组
            const [rows] = await pool.query(
                'SELECT `release` FROM users WHERE userID = ?',
                [userID]
            );

            if (rows.length === 0) {
                throw new Error('用户不存在');
            }

            // 解析JSON数组
            const releases = JSON.parse(rows[0].release || '[]');

            // 检查releaseID是否已存在
            if (!releases.includes(releaseID)) {
                releases.push(releaseID);

                // 更新数据库
                await pool.query(
                    'UPDATE users SET `release` = ? WHERE userID = ?',
                    [JSON.stringify(releases), userID]
                );
            }

            return true;
        } catch (error) {
            console.error('添加发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 从用户的release数组中移除发布内容ID
     * @param {string} userID - 用户ID
     * @param {string} releaseID - 发布内容ID
     * @returns {boolean} - 操作是否成功
     */
    removeReleaseFromUser: async (userID, releaseID) => {
        try {
            // 获取用户当前的release数组
            const [rows] = await pool.query(
                'SELECT `release` FROM users WHERE userID = ?',
                [userID]
            );

            if (rows.length === 0) {
                throw new Error('用户不存在');
            }

            // 解析JSON数组
            const releases = JSON.parse(rows[0].release || '[]');

            // 移除releaseID
            const newReleases = releases.filter(id => id !== releaseID);

            // 更新数据库
            await pool.query(
                'UPDATE users SET `release` = ? WHERE userID = ?',
                [JSON.stringify(newReleases), userID]
            );

            return true;
        } catch (error) {
            console.error('移除发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 添加喜欢内容ID到用户的liked数组
     * @param {string} userID - 用户ID
     * @param {string} releaseID - 喜欢的内容ID
     * @returns {boolean} - 操作是否成功
     */
    addLikedToUser: async (userID, releaseID) => {
        try {
            // 获取用户当前的liked数组
            const [rows] = await pool.query(
                'SELECT liked FROM users WHERE userID = ?',
                [userID]
            );

            if (rows.length === 0) {
                throw new Error('用户不存在');
            }

            // 解析JSON数组
            const liked = JSON.parse(rows[0].liked || '[]');

            // 检查releaseID是否已存在
            if (!liked.includes(releaseID)) {
                liked.push(releaseID);

                // 更新数据库
                await pool.query(
                    'UPDATE users SET liked = ? WHERE userID = ?',
                    [JSON.stringify(liked), userID]
                );
            }

            return true;
        } catch (error) {
            console.error('添加喜欢内容失败:', error);
            throw error;
        }
    },

    /**
     * 从用户的liked数组中移除喜欢内容ID
     * @param {string} userID - 用户ID
     * @param {string} releaseID - 喜欢的内容ID
     * @returns {boolean} - 操作是否成功
     */
    removeLikedFromUser: async (userID, releaseID) => {
        try {
            // 获取用户当前的liked数组
            const [rows] = await pool.query(
                'SELECT liked FROM users WHERE userID = ?',
                [userID]
            );

            if (rows.length === 0) {
                throw new Error('用户不存在');
            }

            // 解析JSON数组
            const liked = JSON.parse(rows[0].liked || '[]');

            // 移除releaseID
            const newLiked = liked.filter(id => id !== releaseID);

            // 更新数据库
            await pool.query(
                'UPDATE users SET liked = ? WHERE userID = ?',
                [JSON.stringify(newLiked), userID]
            );

            return true;
        } catch (error) {
            console.error('移除喜欢内容失败:', error);
            throw error;
        }
    }
};

module.exports = userModel; 