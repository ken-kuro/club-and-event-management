const { body, param, query, validationResult } = require('express-validator');

// Shared handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const errorMessage = firstError.msg || 'Validation error';
    return res.status(400).json({ success: false, message: errorMessage, errors: errors.array() });
  }
  next();
};

// Chains
const searchClubsQuery = [
  query('search').optional().trim().isLength({ min: 1 })
];

const createClubBody = [
  body('name').trim().notEmpty().withMessage('Club name is required').isLength({ min: 1, max: 100 }).withMessage('Club name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Club description must be 500 characters or less')
];

const clubIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid club ID')];

const createEventBody = [
  body('title').trim().notEmpty().withMessage('Event title is required').isLength({ min: 1, max: 100 }).withMessage('Event title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Event description must be 500 characters or less'),
  body('scheduled_date').trim().isISO8601().withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)').custom((value) => {
    const date = new Date(value);
    const now = new Date();
    if (date <= now) {
      throw new Error('Event date must be in the future');
    }
    return true;
  })
];

module.exports = {
  handleValidationErrors,
  searchClubsQuery,
  createClubBody,
  clubIdParam,
  createEventBody
};


