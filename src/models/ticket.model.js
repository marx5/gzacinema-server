module.exports = (sequelize, DataTypes) => {
    const Ticket = sequelize.define('Ticket', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('valid', 'used', 'refunded'),
            defaultValue: 'valid'
        }
    }, {
        tableName: 'tickets',
        timestamps: true
    })
    return Ticket;
}