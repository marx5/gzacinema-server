const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = require('./user.model')(sequelize, DataTypes);
const Cinema = require('./cinema.model')(sequelize, DataTypes);
const Room = require('./room.model')(sequelize, DataTypes);
const Showtime = require('./showtime.model')(sequelize, DataTypes);
const Ticket = require('./ticket.model')(sequelize, DataTypes);
const Booking = require('./booking.model')(sequelize, DataTypes);
const Movie = require('./movie.model')(sequelize, DataTypes);
const Seat = require('./seat.model')(sequelize, DataTypes);

Cinema.hasMany(Room, { foreignKey: 'cinema_id', as: 'rooms' });
Room.belongsTo(Cinema, { foreignKey: 'cinema_id', as: 'cinema' });

Room.hasMany(Seat, { foreignKey: 'room_id', as: 'seats' });
Seat.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

Room.hasMany(Showtime, { foreignKey: 'room_id', as: 'showtimes' });
Showtime.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

Movie.hasMany(Showtime, { foreignKey: 'movie_id', as: 'showtimes' });
Showtime.belongsTo(Movie, { foreignKey: 'movie_id', as: 'movie' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasMany(Ticket, { foreignKey: 'booking_id', as: 'tickets' });
Ticket.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

Seat.hasMany(Ticket, { foreignKey: 'seat_id', as: 'tickets' });
Ticket.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });

Showtime.hasMany(Booking, { foreignKey: 'showtime_id', as: 'bookings' });
Booking.belongsTo(Showtime, { foreignKey: 'showtime_id', as: 'showtime' });

module.exports = {
    sequelize,
    User, Cinema, Room, Showtime, Ticket, Booking, Movie, Seat
};