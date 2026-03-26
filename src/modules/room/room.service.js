const { or } = require('sequelize');
const { Cinema, Room, Seat, sequelize } = require('../../models');
const AppError = require('../../core/utils/AppError');

const createRoom = async (cinemaId, roomData) => {
    const cinema = await Cinema.findByPk(cinemaId);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }

    const { name, rowCount = 5, colCount = 10 } = roomData;
    const t = await sequelize.transaction();
    try {
        const newRoom = await Room.create({
            name,
            cinema_id: cinemaId
        }, { transaction: t });

        const seatsToCreate = [];
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let row = 0; row < rowCount; row++) {
            const rowLetter = alphabet[row];

            for (let col = 1; col <= colCount; col++) {
                let seatType = 'standard';
                if (row === rowCount - 1) {
                    seatType = 'sweetbox';
                }
                else if (row >= rowCount - 3) {
                    seatType = 'vip';
                }

                seatsToCreate.push({
                    room_id: newRoom.id,
                    row_letter: rowLetter,
                    seat_number: col,
                    type: seatType
                })
            }
        }
        await Seat.bulkCreate(seatsToCreate, { transaction: t });
        await t.commit();

        return {
            ...newRoom.toJSON(),
            total_seats_generated: seatsToCreate.length
        }
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

const getRoomsByCinema = async (cinemaId) => {
    return await Room.findAll({
        where: { cinema_id: cinemaId },
        order: [['createdAt', 'DESC']]
    })
}

const updateRoom = async (roomId, roomData) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new AppError('Room not found');
    }

    await room.update({
        name: roomData.name
    });
    return room;
}

const deleteRoom = async (roomId) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new AppError('Room not found', 404);
    }
    await Seat.destroy({ where: { room_id: roomId } });
    await room.destroy();
    return {
        message: 'Room and associated seats deleted successfully'
    };
}

const updateSeatStatus = async (roomId, seatId, status) => {
    const validStatuses = ['available', 'broken', 'maintenance'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid seat status', 400);
    }

    const seat = await Seat.findOne({ where: { id: seatId, room_id: roomId } });
    if (!seat) throw new AppError('Seat not found in this room', 404);

    seat.status = status;
    await seat.save();

    return seat;
};

module.exports = {
    createRoom,
    getRoomsByCinema,
    updateRoom,
    deleteRoom,
    updateSeatStatus
}