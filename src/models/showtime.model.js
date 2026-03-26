module.exports = (sequelize, DataTypes) => {
    const Showtime = sequelize.define('Showtime', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        base_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'showtimes',
        timestamps: true,
        indexes: [
            { fields: ['movie_id'] },
            { fields: ['room_id'] },
            { fields: ['start_time'] }
        ]
    })
    return Showtime;
}