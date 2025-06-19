const express = require('express');
const router = express.Router();
const pool = require('../db');

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

/**
 * @swagger
 * /characters/create:
 *   post:
 *     summary: Crée un personnage pour un utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               slot:
 *                 type: integer
 *               class:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Résultat de la création
 */
router.post('/create', async (req, res) => {
    const { token, slot, class: characterClass, name } = req.body;

    if (!token || slot === undefined || !characterClass || !name) {
        return res.status(400).json({
            status: 'error',
            message: 'Champs requis manquants'
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
        // Vérifie si le slot est déjà utilisé
        const slotCheck = await pool.query(
            'SELECT id FROM characters WHERE user_id = $1 AND slot = $2',
            [user_id, slot]
        );

        if (slotCheck.rows.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Slot déjà occupé'
            });
        }

        // Insère le nouveau personnage
        await pool.query(
            'INSERT INTO characters (user_id, slot, class, name) VALUES ($1, $2, $3, $4)',
            [user_id, slot, characterClass, name]
        );

        return res.json({
            status: 'success',
            message: 'Personnage créé'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: 'Erreur serveur'
        });
    }
});

/**
 * @swagger
 * /characters/delete:
 *   post:
 *     summary: Supprime un personnage de l'utilisateur
 *     description: Supprime le personnage spécifié si l'utilisateur est authentifié et en est le propriétaire.
 *     requestBody:
 *       required: true
 *       description: Token de l'utilisateur ainsi que l'ID du personnage à supprimer.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - character_id
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de session de l'utilisateur.
 *               character_id:
 *                 type: integer
 *                 description: Identifiant du personnage à supprimer.
 *     responses:
 *       200:
 *         description: Suppression réussie du personnage.
 *       400:
 *         description: Token ou character_id manquant.
 *       401:
 *         description: Token invalide.
 *       404:
 *         description: Le personnage n'existe pas ou n'appartient pas à l'utilisateur.
 *       500:
 *         description: Erreur serveur.
 */
router.post('/delete', async (req, res) => {
    const { token, character_id } = req.body;

    if (!token || !character_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Token ou character_id manquant.'
        });
    }

    try {
        const user_id = await validateToken(token);
        if (!user_id) {
            return res.status(401).json({
                status: 'error',
                message: 'Token invalide.'
            });
        }

        const characterCheck = await pool.query(
            'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
            [character_id, user_id]
        );

        if (characterCheck.rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Le personnage n\'existe pas ou n\'appartient pas à cet utilisateur.'
            });
        }

        await pool.query(
            'DELETE FROM characters WHERE id = $1 AND user_id = $2',
            [character_id, user_id]
        );

        return res.json({
            status: 'success',
            message: 'Personnage supprimé avec succès.'
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: 'Erreur serveur.'
        });
    }
});

module.exports = router;
