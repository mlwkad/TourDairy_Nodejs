/**
 * 统计数据信息
 */
const pool = require('../config/db');

async function countData() {
    try {
        // 检查总数据量
        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM releases');
        console.log(`总数据条数: ${totalResult[0].total}`);

        // 检查每个用户的数据量
        const [userCounts] = await pool.query('SELECT userID, COUNT(*) as count FROM releases GROUP BY userID');
        console.log('\n每个用户的数据条数:');
        userCounts.forEach(row => {
            console.log(`${row.userID}: ${row.count}条`);
        });

        // 检查状态字段详情
        const [stateTypes] = await pool.query("SELECT state, COUNT(*) as count FROM releases GROUP BY state");
        console.log('\n状态统计:');
        stateTypes.forEach(row => {
            console.log(`${row.state || 'null'}: ${row.count}条`);
        });

        // 检查用户状态分布
        console.log('\n用户状态分布:');
        for (const user of ['user1', 'user2']) {
            const [states] = await pool.query(`
        SELECT state, COUNT(*) as count 
        FROM releases 
        WHERE userID = ? 
        GROUP BY state
      `, [user]);

            console.log(`\n${user}状态分布:`);
            if (states.length === 0) {
                console.log('无数据');
            } else {
                states.forEach(row => {
                    console.log(`${row.state || 'null'}: ${row.count}条`);
                });
            }
        }

        // 只检查我们添加的记录的状态
        const [newRecords] = await pool.query(`
      SELECT releaseID, state
      FROM releases 
      WHERE releaseID LIKE 'user1_release_%' OR releaseID LIKE 'user2_release_%'
    `);

        console.log(`\n新添加记录数量: ${newRecords.length}`);

        // 计算状态分布
        const stateCount = {};
        for (const row of newRecords) {
            const state = row.state || 'null';
            stateCount[state] = (stateCount[state] || 0) + 1;
        }

        console.log('新添加记录的状态分布:');
        for (const state in stateCount) {
            console.log(`${state}: ${stateCount[state]}条`);
        }

        console.log('\n完成数据统计');
        process.exit(0);
    } catch (error) {
        console.error('统计数据失败:', error);
        process.exit(1);
    }
}

// 执行统计
countData(); 