/**
 * Chuẩn hóa tham số phân trang từ query string
 * @param {Object} query
 * @param {Object} options
 * @param {number} [options.defaultLimit=10]
 * @param {number} [options.maxLimit=100]
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query = {}, { defaultLimit = 10, maxLimit = 100 } = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

/**
 * Chuẩn hóa cấu trúc dữ liệu trả về có phân trang
 * @param {Object} params
 * @param {number} params.count
 * @param {Array} params.rows
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} [params.dataKey='items']
 * @returns {Object}
 */
const formatPaginatedResult = ({ count, rows, page, limit, dataKey = 'items' }) => ({
    total_items: count,
    total_pages: Math.ceil(count / limit),
    current_page: page,
    [dataKey]: rows
});

module.exports = {
    parsePagination,
    formatPaginatedResult
};
