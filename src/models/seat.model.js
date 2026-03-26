module.exports = (sequelize, DataTypes) => {
    const Seat = sequelize.define('Seat', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        row_letter: {
            type: DataTypes.STRING(2),
            allowNull: false
        },
        seat_number: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('standard', 'vip', 'sweetbox'),
            defaultValue: 'standard'
        },
        status: {
            type: DataTypes.ENUM('available', 'broken', 'maintenance'),
            defaultValue: 'available'
        }
    }, {
        tableName: 'seats',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['room_id'] }
        ]
    })
    return Seat;
}