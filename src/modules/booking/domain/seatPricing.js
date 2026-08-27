/**
 * Seat Pricing Domain Rule
 * Chứa logic thuần túy tính toán giá vé theo loại ghế và giá gốc suất chiếu.
 */

const SEAT_SURCHARGES = {
    standard: 0,
    vip: 20000,
    sweetbox: 50000
};

/**
 * Tính toán giá ghế dựa trên base_price và seat.type
 * @param {number|string} basePrice 
 * @param {string} seatType 
 * @returns {number}
 */
const calculateSeatPrice = (basePrice, seatType) => {
    const base = parseFloat(basePrice) || 0;
    const surcharge = SEAT_SURCHARGES[seatType?.toLowerCase()] || 0;
    return base + surcharge;
};

module.exports = {
    SEAT_SURCHARGES,
    calculateSeatPrice
};
