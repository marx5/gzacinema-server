const { Cinema, Room, Seat, Showtime, sequelize } = require('../../models');
const AppError = require('../../core/utils/AppError');

const createRoom = async (cinemaId, roomData) => {
    const cinema = await Cinema.findByPk(cinemaId);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }

    const { name, rowCount = 5, colCount = 10 } = roomData;
    if (rowCount < 1 || rowCount > 26 || colCount < 1 || colCount > 30) {
        throw new AppError('Invalid room dimensions (rowCount: 1-26, colCount: 1-30)', 400);
    }

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
        include: [{
            model: Seat,
            as: 'seats',
            attributes: ['id', 'row_letter', 'seat_number', 'type', 'status']
        }],
        order: [
            ['createdAt', 'DESC'],
            [{ model: Seat, as: 'seats' }, 'row_letter', 'ASC'],
            [{ model: Seat, as: 'seats' }, 'seat_number', 'ASC']
        ]
    });
}

const updateRoom = async (roomId, roomData, cinemaId) => {
    const whereClause = cinemaId ? { id: roomId, cinema_id: cinemaId } : { id: roomId };
    const room = await Room.findOne({ where: whereClause });
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    await room.update({
        name: roomData.name
    });
    return room;
}

const deleteRoom = async (roomId, cinemaId) => {
    const whereClause = cinemaId ? { id: roomId, cinema_id: cinemaId } : { id: roomId };
    const room = await Room.findOne({ where: whereClause });
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const showtimeCount = await Showtime.count({ where: { room_id: roomId } });
    if (showtimeCount > 0) {
        throw new AppError('Cannot delete room with existing showtimes', 400);
    }

    const t = await sequelize.transaction();
    try {
        await Seat.destroy({ where: { room_id: roomId }, transaction: t });
        await room.destroy({ transaction: t });
        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }

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