/**
 * 验证工具类
 * 提供常用的输入验证函数
 */

const validator = {
    /**
     * 验证是否为空值
     * @param {*} value - 要验证的值
     * @returns {boolean} 是否为空
     */
    isEmpty: (value) => {
        return (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)
        );
    },

    /**
     * 验证用户名格式 (允许中文、字母和数字的组合)
     * @param {string} username - 用户名
     * @returns {boolean} 是否合法
     */
    isValidUsername: (username) => {
        const regex = /^[\u4e00-\u9fa5A-Za-z0-9]{2,20}$/;
        return regex.test(username);
    },

    /**
     * 验证密码强度 (至少6位，包含字母和数字)
     * @param {string} password - 密码
     * @returns {boolean} 是否合法
     */
    isValidPassword: (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
        return regex.test(password);
    },

    /**
     * 验证URL格式
     * @param {string} url - URL字符串
     * @returns {boolean} 是否合法
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 防SQL注入处理
     * @param {string} input - 输入字符串
     * @returns {string} 处理后的字符串
     */
    escapeSql: (input) => {
        if (typeof input !== 'string') {
            return input;
        }

        // 转义SQL注入风险字符
        return input
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\x00/g, '\\0')
            .replace(/\x1a/g, '\\Z');
    },

    /**
     * 验证数字类型
     * @param {*} value - 要验证的值
     * @returns {boolean} 是否为数字
     */
    isNumber: (value) => {
        if (typeof value === 'number') {
            return !isNaN(value);
        }
        if (typeof value === 'string') {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }
        return false;
    },

    /**
     * 验证整数类型
     * @param {*} value - 要验证的值
     * @returns {boolean} 是否为整数
     */
    isInteger: (value) => {
        if (typeof value === 'number') {
            return Number.isInteger(value);
        }
        if (typeof value === 'string') {
            return /^-?\d+$/.test(value);
        }
        return false;
    },

    /**
     * 验证正整数类型
     * @param {*} value - 要验证的值
     * @returns {boolean} 是否为正整数
     */
    isPositiveInteger: (value) => {
        if (typeof value === 'number') {
            return Number.isInteger(value) && value > 0;
        }
        if (typeof value === 'string') {
            return /^\d+$/.test(value) && parseInt(value) > 0;
        }
        return false;
    },

    /**
     * 验证数组
     * @param {*} value - 要验证的值
     * @returns {boolean} 是否为数组
     */
    isArray: (value) => {
        return Array.isArray(value);
    }
};

module.exports = validator; 