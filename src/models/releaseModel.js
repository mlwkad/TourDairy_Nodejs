/**
 * 发布内容模型
 * 处理与发布内容相关的数据库操作
 */
const pool = require('../config/db');

const releaseModel = {
    /**
     * 初始化发布内容表
     * 创建存储发布信息的数据表
     * 
     * 表结构：
     * - releaseID: 发布内容ID（字符串）
     * - userID: 用户ID（字符串）
     * - title: 标题（字符串）
     * - playTime: 游玩时间（数字）
     * - money: 费用（数字）
     * - personNum: 人数（数字）
     * - content: 内容描述（字符串）
     * - pictures: 图片URL数组（TEXT格式存储JSON字符串）
     * - videos: 视频URL数组（TEXT格式存储JSON字符串）
     * - cover: 视频封面URL（字符串）
     * - location: 位置（字符串）
     * - state: 审核状态（字符串）'wait'、'resolve'、'reject'
     * - reason: 未通过原因（字符串）
     */
    initTable: async () => {
        try {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS releases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          releaseID VARCHAR(50) UNIQUE NOT NULL,
          userID VARCHAR(50) NOT NULL,
          title VARCHAR(100) NOT NULL,
          playTime INT DEFAULT 0,
          money DECIMAL(10, 2) DEFAULT 0,
          personNum INT DEFAULT 1,
          content TEXT,
          pictures TEXT,
          videos TEXT,
          cover VARCHAR(255),
          location VARCHAR(255),
          state VARCHAR(20) DEFAULT 'wait',
          reason VARCHAR(255) DEFAULT '待审核',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
        )
      `);
            console.log('发布内容表初始化成功');

            // 检查是否需要插入测试数据
            const [rows] = await pool.query('SELECT COUNT(*) as count FROM releases');
            if (rows[0].count === 0) {
                // 插入测试数据
                await releaseModel.insertTestData();
            }
        } catch (error) {
            console.error('初始化发布内容表失败:', error);
            throw error;
        }
    },

    /**
     * 插入测试数据
     */
    insertTestData: async () => {
        try {
            // 插入测试发布内容
            await pool.query(`
        INSERT INTO releases (releaseID, userID, title, playTime, money, personNum, content, pictures, videos, cover, location, state, reason) VALUES
        ('release1', 'user1', '北京三日游从您提供的前端API接口来看', 120, 500.00, 2, '这是一个测试发布内容1', '["https://example.com/pic1.jpg", "https://example.com/pic2.jpg"]', '["https://example.com/video1.mp4"]', 'https://example.com/cover1.jpg', '北京市海淀区', 'resolve', ''),
        ('release2', 'user1', '上海周末游从您提供的前端API接口来看，不需要修改这些接口的定义', 180, 800.00, 3, '这是一个测试发布内容2', '["https://example.com/pic3.jpg"]', '[]', 'https://example.com/cover2.jpg', '上海市浦东新区', 'resolve', ''),
        ('release3', 'user2', '广州一日游', 90, 300.00, 1, '这是一个测试发布内容3', '["https://example.com/pic4.jpg", "https://example.com/pic5.jpg"]', '[]', NULL, '广州市天河区', 'wait', '待审核'),
        ('release4', 'user2', '从您提供的前端API接口来看', 240, 1200.00, 4, '这是一个测试发布内容4', '[]', '["https://example.com/video2.mp4"]', 'https://example.com/cover4.jpg', '深圳市南山区', 'reject', '内容不符合规范')
      `);

            console.log('测试发布内容数据已插入');
        } catch (error) {
            console.error('插入测试数据失败:', error);
            throw error;
        }
    },

    /**
     * 获取所有发布内容
     * @param {number} limit - 限制条数，默认为50
     * @param {number} offset - 偏移量，默认为0
     * @param {string} state - 审核状态，默认为'resolve'
     * @returns {Array} - 发布内容列表
     */
    getAllReleases: async (limit = 50, offset = 0, state = 'resolve') => {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.state = ?
                ORDER BY r.createdAt DESC LIMIT ? OFFSET ?`,
                [state, limit, offset]
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('获取发布内容列表失败:', error);
            throw error;
        }
    },

    /**
     * 根据发布内容ID获取发布内容
     * @param {string} releaseID - 发布内容ID
     * @returns {Object|null} - 发布内容对象或null
     */
    getReleaseByID: async (releaseID) => {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.releaseID = ?`,
                [releaseID]
            );

            if (!rows.length) return null;

            // 处理返回的数据，确保图片和视频是JSON对象
            const release = rows[0];
            return {
                ...release,
                pictures: JSON.parse(release.pictures || '[]'),
                videos: JSON.parse(release.videos || '[]')
            };
        } catch (error) {
            console.error('获取发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 根据用户ID获取该用户的所有发布内容
     * @param {string} userID - 用户ID
     * @returns {Array} - 发布内容列表
     */
    getReleasesByUserID: async (userID) => {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.userID = ? 
                ORDER BY r.createdAt DESC`,
                [userID]
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('获取用户发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 创建新的发布内容
     * @param {Object} releaseData - 发布内容数据
     * @returns {Object} - 创建的发布内容
     */
    createRelease: async (releaseData) => {
        try {
            const {
                releaseID,
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
            } = releaseData;

            // 检查releaseID是否已存在
            const existingRelease = await releaseModel.getReleaseByID(releaseID);
            if (existingRelease) {
                throw new Error('发布内容ID已存在');
            }

            // 处理图片和视频数组
            const picturesJSON = pictures ? JSON.stringify(pictures) : '[]';
            const videosJSON = videos ? JSON.stringify(videos) : '[]';

            // 插入新发布内容，默认审核状态为wait，原因为待审核
            await pool.query(
                `INSERT INTO releases 
         (releaseID, userID, title, playTime, money, personNum, content, pictures, videos, cover, location, state, reason) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'wait', '待审核')`,
                [releaseID, userID, title, playTime, money, personNum, content, picturesJSON, videosJSON, cover || null, location]
            );

            // 返回创建的发布内容
            return await releaseModel.getReleaseByID(releaseID);
        } catch (error) {
            console.error('创建发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 更新发布内容
     * @param {string} releaseID - 发布内容ID
     * @param {Object} updateData - 要更新的数据
     * @returns {Object} - 更新后的发布内容
     */
    updateRelease: async (releaseID, updateData) => {
        try {
            const allowedFields = ['title', 'playTime', 'money', 'personNum', 'content', 'pictures', 'videos', 'cover', 'location', 'state', 'reason'];
            const updates = [];
            const values = [];

            // 构建更新字段
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    updates.push(`${field} = ?`);

                    // 处理JSON字段
                    if (field === 'pictures' || field === 'videos') {
                        values.push(JSON.stringify(updateData[field]));
                    } else {
                        values.push(updateData[field]);
                    }
                }
            }

            if (updates.length === 0) {
                throw new Error('没有提供有效的更新字段');
            }

            // 添加releaseID作为条件
            values.push(releaseID);

            // 执行更新
            await pool.query(
                `UPDATE releases SET ${updates.join(', ')} WHERE releaseID = ?`,
                values
            );

            // 返回更新后的发布内容
            return await releaseModel.getReleaseByID(releaseID);
        } catch (error) {
            console.error('更新发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 更新游记审核状态
     * @param {string} releaseID - 发布内容ID
     * @param {string} state - 审核状态 'wait', 'resolve', 'reject'
     * @param {string} reason - 未通过原因（当状态为reject时必须提供）
     * @returns {Object} - 更新后的发布内容
     */
    updateReleaseState: async (releaseID, state, reason) => {
        try {
            // 验证状态值
            if (!['wait', 'resolve', 'reject'].includes(state)) {
                throw new Error('无效的审核状态值');
            }

            // 如果状态为reject，必须提供原因
            if (state === 'reject' && (!reason || reason.trim() === '')) {
                throw new Error('拒绝时必须提供原因');
            }

            // 设置默认原因
            let updatedReason = reason;
            if (state === 'wait') {
                updatedReason = '待审核';
            } else if (state === 'resolve' && (!reason || reason.trim() === '')) {
                updatedReason = '';
            }

            // 执行更新
            await pool.query(
                `UPDATE releases SET state = ?, reason = ? WHERE releaseID = ?`,
                [state, updatedReason, releaseID]
            );

            // 返回更新后的发布内容
            return await releaseModel.getReleaseByID(releaseID);
        } catch (error) {
            console.error('更新游记审核状态失败:', error);
            throw error;
        }
    },

    /**
     * 删除发布内容
     * @param {string} releaseID - 发布内容ID
     * @returns {boolean} - 操作是否成功
     */
    deleteRelease: async (releaseID) => {
        try {
            const [result] = await pool.query(
                'DELETE FROM releases WHERE releaseID = ?',
                [releaseID]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('删除发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 根据releaseID列表批量获取发布内容
     * @param {Array} releaseIDs - 发布内容ID数组
     * @returns {Array} - 发布内容列表
     */
    getReleasesByIDs: async (releaseIDs) => {
        try {
            if (!releaseIDs || releaseIDs.length === 0) {
                return [];
            }

            // 使用 IN 操作符查询多个ID
            const placeholders = releaseIDs.map(() => '?').join(',');
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.releaseID IN (${placeholders}) 
                ORDER BY r.createdAt DESC`,
                releaseIDs
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('批量获取发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 根据标题搜索发布内容
     * @param {string} title - 要搜索的标题关键词
     * @param {string} state - 审核状态，默认为'resolve'
     * @returns {Array} - 匹配的发布内容列表
     */
    searchReleasesByTitle: async (title, state = 'resolve') => {
        try {
            console.log(`[DEBUG] 开始搜索标题含有 "${title}" 的发布内容，状态为 ${state}`);

            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.title LIKE ? AND r.state = ?
                ORDER BY r.createdAt DESC`,
                [`%${title}%`, state]
            );

            console.log(`[DEBUG] 标题搜索结果数量: ${rows.length}`);
            if (rows.length > 0) {
                console.log(`[DEBUG] 搜索到的标题:`);
                rows.forEach((row, index) => {
                    console.log(`[DEBUG] ${index + 1}. "${row.title}" (ID: ${row.releaseID})`);
                });
            }

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('根据标题搜索发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 根据用户名搜索发布内容
     * @param {string} userName - 用户名
     * @param {string} state - 审核状态，默认为'resolve'
     * @returns {Array} - 匹配的发布内容列表
     */
    searchReleasesByUserName: async (userName, state = 'resolve') => {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE u.userName = ? AND r.state = ?
                ORDER BY r.createdAt DESC`,
                [userName, state]
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('根据用户名搜索发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 同时根据用户ID和标题搜索发布内容
     * @param {string} userID - 用户ID
     * @param {string} title - 标题关键词
     * @returns {Array} - 匹配的发布内容列表
     */
    searchReleasesByUserIDAndTitle: async (userID, title) => {
        try {
            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.userID = ? AND r.title LIKE ? 
                ORDER BY r.createdAt DESC`,
                [userID, `%${title}%`]
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('同时根据用户ID和标题搜索发布内容失败:', error);
            throw error;
        }
    },

    /**
     * 根据用户ID列表批量获取用户的发布内容
     * @param {Array} userIDs - 用户ID数组
     * @param {string} state - 审核状态，默认为'resolve'
     * @returns {Array} - 发布内容列表
     */
    getReleasesByUserIDs: async (userIDs, state = 'resolve') => {
        try {
            if (!userIDs || userIDs.length === 0) {
                return [];
            }

            // 使用 IN 操作符查询多个用户ID
            const placeholders = userIDs.map(() => '?').join(',');
            const parameters = [...userIDs, state];

            const [rows] = await pool.query(
                `SELECT r.*, u.userName, u.avatar 
                FROM releases r
                LEFT JOIN users u ON r.userID = u.userID
                WHERE r.userID IN (${placeholders}) AND r.state = ?
                ORDER BY r.createdAt DESC`,
                parameters
            );

            // 处理返回的数据，确保图片和视频是JSON对象
            return rows.map(row => ({
                ...row,
                pictures: JSON.parse(row.pictures || '[]'),
                videos: JSON.parse(row.videos || '[]')
            }));
        } catch (error) {
            console.error('批量获取用户发布内容失败:', error);
            throw error;
        }
    }
};

module.exports = releaseModel; 