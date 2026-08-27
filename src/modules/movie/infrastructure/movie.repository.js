const { Movie, Showtime, Booking, Ticket, sequelize } = require('../../../models');
const { Op } = require('sequelize');

/**
 * Movie Repository (Infrastructure Layer)
 * Cô lập toàn bộ truy vấn ORM và Raw SQL khỏi Application Service.
 */
class MovieRepository {
    async create(data) {
        return await Movie.create(data);
    }

    async findById(id) {
        return await Movie.findByPk(id);
    }

    async update(id, data) {
        const movie = await Movie.findByPk(id);
        if (!movie) return null;
        await movie.update(data);
        return movie;
    }

    async delete(id) {
        const movie = await Movie.findByPk(id);
        if (!movie) return null;
        await movie.destroy();
        return movie;
    }

    async findAndCountAll({ condition, limit, offset, order }) {
        return await Movie.findAndCountAll({
            where: condition,
            order: order || [['release_date', 'DESC']],
            limit,
            offset
        });
    }

    async findTopRanking(limit = 10) {
        const query = `
            SELECT 
                m.id,
                m.title,
                m.genre,
                m.description,
                m.duration_minutes,
                m.release_date,
                m.thumbnail,
                m.trailer_url,
                COUNT(DISTINCT t.id) AS total_tickets,
                COALESCE(SUM(t.price), 0) AS total_revenue,
                COALESCE(MIN(b.createdAt), m.createdAt) AS first_revenue_time
            FROM movies m
            LEFT JOIN showtimes s ON s.movie_id = m.id AND s.deletedAt IS NULL
            LEFT JOIN bookings b ON b.showtime_id = s.id AND b.status = 'paid' AND b.deletedAt IS NULL
            LEFT JOIN tickets t ON t.booking_id = b.id AND t.status IN ('valid', 'used') AND t.deletedAt IS NULL
            WHERE m.deletedAt IS NULL
            GROUP BY m.id, m.title, m.genre, m.description, m.duration_minutes, m.release_date, m.thumbnail, m.trailer_url, m.createdAt
            ORDER BY 
                total_tickets DESC,
                total_revenue DESC,
                first_revenue_time ASC
            LIMIT :limit;
        `;

        const rankingMovies = await sequelize.query(query, {
            replacements: { limit: parseInt(limit, 10) || 10 },
            type: sequelize.QueryTypes.SELECT
        });

        return rankingMovies.map((movie, index) => ({
            ...movie,
            rank: index + 1,
            total_tickets: parseInt(movie.total_tickets, 10) || 0,
            total_revenue: parseFloat(movie.total_revenue) || 0
        }));
    }
}

module.exports = new MovieRepository();
