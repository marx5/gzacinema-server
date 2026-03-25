const { or } = require('sequelize');
const { Cinema, Room, Seat } = require('../../models');

const createRoom = async (cinemaId, roomData) => {
    const cinema = await Cinema.findByPk(cinemaId);
    if (!cinema) {
        throw new Error('Cinema not found');
    }

    const { name, rowCount = 5, colCount = 10 } = roomData;
    const newRoom = await Room.create({
        name,
        cinema_id: cinemaId
    })

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
    await Seat.bulkCreate(seatsToCreate);

    return {
        ...newRoom.toJSON(),
        total_seats_generated: seatsToCreate.length
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
        throw new Error('Room not found');
    }

    await room.update({
        name: roomData.name
    });
    return room;
}

const deleteRoom = async (roomId) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new Error('Room not found');
    }
    await Seat.destroy({ where: { room_id: roomId } });
    await room.destroy();
    return {
        message: 'Room and associated seats deleted successfully'
    };
}

module.exports = {
    createRoom,
    getRoomsByCinema,
    updateRoom,
    deleteRoom
}