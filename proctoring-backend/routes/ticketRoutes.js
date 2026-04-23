const express = require('express');
const { 
  createTicket, 
  getUserTickets, 
  getAllTickets, 
  replyTicket, 
  updateTicketStatus,
  assignTicket,
  getTicketStats
} = require('../controllers/ticketController');
const router = express.Router();

router.post('/', createTicket);
router.get('/user/:userId', getUserTickets);
router.get('/stats', getTicketStats);
router.get('/', getAllTickets);
router.put('/:id/reply', replyTicket);
router.put('/:id/status', updateTicketStatus);
router.put('/:id/assign', assignTicket);

// Legacy support
router.get('/student/:studentId', getUserTickets);

module.exports = router;
