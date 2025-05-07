/**
 * 检查数据库中的数据
 */
const pool = require('../config/db');

async function checkData() {
    try {
        // 检查总数据量
        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM releases');
        console.log(`总数据条数: ${totalResult[0].total}`);

        // 检查每个用户的数据量
        const [userCounts] = await pool.query('SELECT userID, COUNT(*) as count FROM releases GROUP BY userID');
        console.log('每个用户的数据条数:');
        userCounts.forEach(row => {
            console.log(`${row.userID}: ${row.count}条`);
        });

        // 检查状态字段详情
        const [stateTypes] = await pool.query("SELECT state, COUNT(*) as count FROM releases GROUP BY state");
        console.log('\n状态统计:');
        stateTypes.forEach(row => {
            console.log(`${row.state}: ${row.count}条`);
        });

        // 检查user1的状态分布
        const [user1States] = await pool.query("SELECT state, COUNT(*) as count FROM releases WHERE userID = 'user1' GROUP BY state");
        console.log('\nuser1状态分布:');
        user1States.forEach(row => {
            console.log(`${row.state}: ${row.count}条`);
        });

        // 检查user2的状态分布
        const [user2States] = await pool.query("SELECT state, COUNT(*) as count FROM releases WHERE userID = 'user2' GROUP BY state");
        console.log('\nuser2状态分布:');
        user2States.forEach(row => {
            console.log(`${row.state}: ${row.count}条`);
        });

        // 只检查我们添加的30条记录的状态
        console.log('\n新添加记录的状态:');
        const [newRecords] = await pool.query(`
            SELECT releaseID, state
            FROM releases 
            WHERE releaseID LIKE 'user1_release_%' OR releaseID LIKE 'user2_release_%'
            ORDER BY releaseID
        `);

        console.log(`新添加记录数量: ${newRecords.length}`);

        const stateCount = { resolve: 0, wait: 0, reject: 0 };
        newRecords.forEach(row => {
            stateCount[row.state] = (stateCount[row.state] || 0) + 1;
        });

        console.log('状态分布:');
        Object.keys(stateCount).forEach(state => {
            console.log(`${state}: ${stateCount[state]}条`);
        });

        process.exit(0);
    } catch (error) {
        console.error('检查数据失败:', error);
        process.exit(1);
    }
}

checkData(); 