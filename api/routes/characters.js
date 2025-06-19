const express = require('express');
const router = express.Router();
const pool = require('../db'); // connexion à la BDD
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt';

async function validateToken(token) {
    const result = await pool.query(
        'SELECT user_id FROM active_sessions WHERE session_token = $1',
        [token]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].user_id;
}

/**
 * @swagger
 * /characters:
 *   post:
 *     summary: Récupère les personnages d'un utilisateur via son token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Liste des personnages
 */
router.post('/', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            status: 'error',
            message: 'Token non fourni'
        });
    }

    const user_id = await validateToken(token);

    if (!user_id) {
        return res.status(401).json({
            status: 'error',
            message: 'Token invalide'
        });
    }

    try {
        const result = await pool.query(
            'SELECT id, slot, class, name, level FROM characters WHERE user_id = $1',
            [user_id]
        );

        const characters = result.rows;
        return res.json({
            status: 'success',
            characters,
            has_characters: characters.length > 0,
            character_count: characters.length
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
