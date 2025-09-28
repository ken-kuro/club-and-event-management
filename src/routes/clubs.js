const express = require('express');
const router = express.Router();

const { statements } = require('../db');
const { searchClubsQuery, createClubBody, handleValidationErrors } = require('../validators');

// GET /clubs - list or search
router.get('/', searchClubsQuery, handleValidationErrors, (req, res) => {
  try {
    let clubs;
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      clubs = statements.searchClubs.all(searchTerm, searchTerm);
    } else {
      clubs = statements.getAllClubs.all();
    }
    res.json({ success: true, data: clubs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /clubs - create
router.post('/', createClubBody, handleValidationErrors, (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = statements.getClubByName.get(name);
    if (existing) {
      return res.status(409).json({ success: false, message: 'A club with this name already exists' });
    }
    const result = statements.createClub.run(name, description);
    const newClub = statements.getClubById.get(result.lastInsertRowid);
    res.status(201).location(`/clubs/${newClub.id}`).json({ success: true, message: 'Club created successfully', data: newClub });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


