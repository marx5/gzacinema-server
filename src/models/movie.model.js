module.exports = (sequelize, DataTypes) => {
    const Movie = sequelize.define('Movie', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        genre: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
        },
        duration_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        release_date: {
            type: DataTypes.DATEONLY,
        },
        thumbnail: {
            type: DataTypes.STRING,
            allowNull: true
        },
        trailer_url: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'movies',
        timestamps: true
    });
    return Movie;
}