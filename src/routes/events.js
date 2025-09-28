const express = require('express');
const router = express.Router({ mergeParams: true });

const { statements } = require('../db');
const { clubIdParam, createEventBody, handleValidationErrors } = require('../validators');

// GET /clubs/:id/events
router.get('/', clubIdParam, handleValidationErrors, (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const club = statements.getClubById.get(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    const events = statements.getEventsByClubId.all(clubId);
    res.json({ success: true, data: { club, events } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /clubs/:id/events
router.post('/', clubIdParam.concat(createEventBody), handleValidationErrors, (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const { title, description, scheduled_date } = req.body;
    const club = statements.getClubById.get(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    const isoDate = new Date(scheduled_date).toISOString();
    const result = statements.createEvent.run(clubId, title, description, isoDate);
    const newEvent = statements.getEventById.get(result.lastInsertRowid);
    res.status(201).location(`/clubs/${clubId}/events/${newEvent.id}`).json({ success: true, message: 'Event created successfully', data: newEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


