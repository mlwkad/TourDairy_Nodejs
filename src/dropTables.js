/**指令:node src/dropTables.js
 * 只删除数据库中的表，不会重新创建
 */
const pool = require('./config/db');

const dropTables = async () => {
    try {
        console.log('开始删除数据库表...');

        // 删除现有表（如果存在）- 先删除有外键依赖的表
        console.log('删除releases表...');
        await pool.query('DROP TABLE IF EXISTS releases');

        console.log('删除users表...');
        await pool.query('DROP TABLE IF EXISTS users');

        console.log('所有表已成功删除！');
        process.exit(0);
    } catch (error) {
        console.error('删除表失败:', error);
        process.exit(1);
    }
};

// 执行删除表操作
dropTables(); 