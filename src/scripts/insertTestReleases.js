/**
 * 插入测试发布数据脚本
 * 命令:node src/scripts/insertTestReleases.js
 * 为user1和user2各插入15条随机数据
 */
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 图片和视频资源
const pictures = [
    '/static/333.jpg',
    '/static/444.jpg',
    '/static/555.jpg',
    '/static/666.jpg'
];

const videos = ['/static/test.mp4'];

// 随机获取标题
const getTitles = () => {
    const titles = [
        '北京三日游',
        '上海周末游',
        '广州一日游',
        '深圳科技游',
        '杭州西湖行',
        '成都美食游',
        '重庆火锅行',
        '西安历史游',
        '南京古都游',
        '厦门海岛游',
        '青岛海滨行',
        '长沙文化游',
        '苏州园林游',
        '大连海滨游',
        '昆明春城行',
        '三亚海滨度假',
        '丽江古城行',
        '九寨沟风景游',
        '张家界自然游',
        '黄山风景游'
    ];

    return titles[Math.floor(Math.random() * titles.length)];
};

// 随机获取城市
const getCities = () => {
    const cities = [
        '北京市海淀区',
        '上海市浦东新区',
        '广州市天河区',
        '深圳市南山区',
        '杭州市西湖区',
        '成都市锦江区',
        '重庆市渝中区',
        '西安市碑林区',
        '南京市鼓楼区',
        '厦门市思明区',
        '青岛市市南区',
        '长沙市岳麓区',
        '苏州市姑苏区',
        '大连市中山区',
        '昆明市盘龙区'
    ];

    return cities[Math.floor(Math.random() * cities.length)];
};

// 随机获取1-4张图片
const getRandomPictures = () => {
    const count = Math.floor(Math.random() * 4) + 1; // 至少1张，最多4张
    const selectedPictures = [];

    for (let i = 0; i < count; i++) {
        const pic = pictures[Math.floor(Math.random() * pictures.length)];
        if (!selectedPictures.includes(pic)) {
            selectedPictures.push(pic);
        }
    }

    // 确保至少有一张图片
    if (selectedPictures.length === 0) {
        selectedPictures.push(pictures[0]);
    }

    return JSON.stringify(selectedPictures);
};

// 随机决定是否有视频
const getRandomVideos = () => {
    // 50%的概率有视频
    return Math.random() > 0.5 ? JSON.stringify([videos[0]]) : JSON.stringify([]);
};

// 获取随机封面图
const getRandomCover = () => {
    return pictures[Math.floor(Math.random() * pictures.length)];
};

// 获取随机时长、价格和人数
const getRandomDuration = () => Math.floor(Math.random() * 240) + 60; // 60-300分钟
const getRandomPrice = () => parseFloat((Math.random() * 1000 + 100).toFixed(2)); // 100-1100元
const getRandomPeople = () => Math.floor(Math.random() * 5) + 1; // 1-5人

// 获取随机描述
const getRandomDescription = () => {
    const descriptions = [
        '这是一个美妙的旅行体验',
        '推荐给所有喜欢探索的人',
        '绝对值得一去的地方',
        '让人难忘的旅行体验',
        '非常适合周末出游',
        '性价比超高的旅行选择',
        '带给您独特的文化体验',
        '自然景观令人叹为观止',
        '美食与美景的完美结合',
        '这里的风景如画',
        '适合亲子出游的好去处',
        '放松身心的绝佳选择',
        '让您感受不一样的风土人情',
        '值得您花时间探索的地方',
        '这里的每一处都是景点'
    ];

    return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// 插入数据的主函数
async function insertTestReleases() {
    try {
        console.log('开始插入测试发布数据...');

        // 检查数据库中已存在的releaseID
        const [existingReleases] = await pool.query('SELECT releaseID FROM releases');
        const existingReleaseIDs = existingReleases.map(r => r.releaseID);
        console.log(`数据库中已有 ${existingReleaseIDs.length} 条数据`);

        // 为user1插入15条数据
        let user1Count = 0;
        let user1Index = 5;
        while (user1Count < 15) {
            const releaseID = `user1_release_${user1Index}`;
            if (!existingReleaseIDs.includes(releaseID)) {
                await insertRelease('user1', releaseID);
                user1Count++;
            }
            user1Index++;
        }

        // 为user2插入15条数据
        let user2Count = 0;
        let user2Index = 5;
        while (user2Count < 15) {
            const releaseID = `user2_release_${user2Index}`;
            if (!existingReleaseIDs.includes(releaseID)) {
                await insertRelease('user2', releaseID);
                user2Count++;
            }
            user2Index++;
        }

        console.log(`测试发布数据插入完成 - user1: ${user1Count}条, user2: ${user2Count}条`);
        process.exit(0);
    } catch (error) {
        console.error('插入测试数据失败:', error);
        process.exit(1);
    }
}

// 插入单条数据
async function insertRelease(userID, releaseID) {
    const title = getTitles();
    const playTime = getRandomDuration();
    const money = getRandomPrice();
    const personNum = getRandomPeople();
    const content = getRandomDescription();
    const pictures = getRandomPictures();
    const videos = getRandomVideos();
    const cover = getRandomCover();
    const location = getCities();

    const query = `
    INSERT INTO releases 
    (releaseID, userID, title, playTime, money, personNum, content, pictures, videos, cover, location, state, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'resolve', '')
  `;

    const values = [
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
    ];

    await pool.query(query, values);
    console.log(`插入数据成功: ${userID} - ${releaseID}`);
}

// 执行插入操作
insertTestReleases(); 