const pool = require('../config/db');

(async () => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM releases WHERE releaseID LIKE 'user1_release_%' OR releaseID LIKE 'user2_release_%'");
        console.log(`新增记录总数: ${rows[0].count}`);

        const [stateRows] = await pool.query("SELECT state, COUNT(*) as count FROM releases WHERE releaseID LIKE 'user1_release_%' OR releaseID LIKE 'user2_release_%' GROUP BY state");
        console.log('状态分布:');

        for (const row of stateRows) {
            console.log(`${row.state}: ${row.count}条`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})(); 