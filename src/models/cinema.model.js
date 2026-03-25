module.exports = (sequelize, DataTypes) => {
    const Cinema = sequelize.define('Cinema', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'cinemas',
        timestamps: true
    })
    return Cinema;
}