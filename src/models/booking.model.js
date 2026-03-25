module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
            defaultValue: 'pending'
        }
    }, {
        tableName: 'bookings',
        timestamps: true
    })
    return Booking;
}