/**
 * Seat Validation Domain Rules
 * Chứa logic kiểm tra tính hợp lệ khi chọn ghế:
 * 1. Ghế phải cùng loại (standard, vip, sweetbox)
 * 2. Ghế phải liền kề 4 hướng (trên, dưới, trái, phải) và tạo thành 1 cụm liên thông duy nhất.
 */

/**
 * Kiểm tra 2 ghế có liền kề nhau theo 4 hướng không
 * @param {Object} seatA { row_letter, seat_number }
 * @param {Object} seatB { row_letter, seat_number }
 * @returns {boolean}
 */
const areSeatsAdjacent = (seatA, seatB) => {
    if (!seatA || !seatB) return false;

    const rowA = seatA.row_letter.trim().toUpperCase();
    const rowB = seatB.row_letter.trim().toUpperCase();
    const numA = parseInt(seatA.seat_number, 10);
    const numB = parseInt(seatB.seat_number, 10);

    // Kề trái / phải: Cùng hàng, khoảng cách số ghế = 1
    if (rowA === rowB && Math.abs(numA - numB) === 1) {
        return true;
    }

    // Kề trên / dưới: Cùng cột, hàng liền kề (khoảng cách charCode = 1)
    if (numA === numB && Math.abs(rowA.charCodeAt(0) - rowB.charCodeAt(0)) === 1) {
        return true;
    }

    return false;
};

/**
 * Kiểm tra danh sách ghế có cùng loại không
 * @param {Array<Object>} seats 
 * @returns {boolean}
 */
const areSeatsSameType = (seats) => {
    if (!seats || seats.length <= 1) return true;
    const firstType = seats[0].type;
    return seats.every(seat => seat.type === firstType);
};

/**
 * Kiểm tra một tập hợp ghế có tạo thành 1 thành phần liên thông 4 hướng duy nhất không (sử dụng BFS)
 * @param {Array<Object>} seats 
 * @returns {boolean}
 */
const areSeatsConnected = (seats) => {
    if (!seats || seats.length <= 1) return true;

    const visited = new Set();
    const queue = [seats[0]];
    visited.add(seats[0].id);

    while (queue.length > 0) {
        const current = queue.shift();

        for (const neighbor of seats) {
            if (!visited.has(neighbor.id) && areSeatsAdjacent(current, neighbor)) {
                visited.add(neighbor.id);
                queue.push(neighbor);
            }
        }
    }

    // Nếu số ghế duyệt được bằng tổng số ghế trong tập hợp thì tập ghế liên thông
    return visited.size === seats.length;
};

/**
 * Kiểm tra xem một tập ghế mới thêm vào có liền kề với ít nhất một ghế trong tập ghế hiện tại không
 * @param {Array<Object>} existingSeats 
 * @param {Array<Object>} newSeats 
 * @returns {boolean}
 */
const isNewSeatsAdjacentToExisting = (existingSeats, newSeats) => {
    if (!existingSeats || existingSeats.length === 0) return true;
    if (!newSeats || newSeats.length === 0) return true;

    return newSeats.some(newSeat =>
        existingSeats.some(existingSeat => areSeatsAdjacent(existingSeat, newSeat))
    );
};

module.exports = {
    areSeatsAdjacent,
    areSeatsSameType,
    areSeatsConnected,
    isNewSeatsAdjacentToExisting
};
