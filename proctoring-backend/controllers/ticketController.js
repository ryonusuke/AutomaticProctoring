const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @route POST /api/tickets
exports.createTicket = async (req, res) => {
  try {
    const { studentId, userId, subject, message, category, examRef, priority, tags } = req.body;
    const resolvedUserId = userId || studentId;
    if (!resolvedUserId || !subject || !message)
      return res.status(400).json({ success: false, message: 'userId, subject and message are required.' });
    const user = await User.findById(resolvedUserId).select('role name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    const ticket = await Ticket.create({
      userId: resolvedUserId,
      userRole: user.role,
      subject, message, category, examRef, priority,
      tags: tags || [],
      lastActivityAt: new Date()
    });
    
    // Notify admins about new ticket
    await User.updateMany(
      { role: 'admin' },
      {
        $push: {
          notifications: {
            $each: [{
              type: 'info',
              title: `New ${user.role === 'examiner' ? 'Teacher' : 'Student'} Ticket`,
              message: `${user.name} created: "${subject}"`,
              isRead: false,
              date: new Date()
            }],
            $position: 0
          }
        }
      }
    );
    
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/tickets/user/:userId (works for all roles)
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId })
      .populate('assignedTo', 'name role')
      .sort({ lastActivityAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/tickets (admin - with filters)
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, userRole, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userRole) filter.userRole = userRole;
    if (category) filter.category = category;
    
    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name role')
      .sort({ priority: -1, lastActivityAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/tickets/:id/reply
exports.replyTicket = async (req, res) => {
  try {
    const { from, message, userId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    ticket.replies.push({ from, message, userId, date: new Date() });
    if (ticket.status === 'open') ticket.status = 'in_progress';
    ticket.lastActivityAt = new Date();
    await ticket.save();

    await ticket.populate('userId', 'name email role');

    // Notify the ticket owner when someone replies
    if (ticket.userId && userId !== ticket.userId._id.toString()) {
      const replyerRole = from === 'admin' ? 'Admin' : from === 'examiner' ? 'Teacher' : 'Student';
      await User.findByIdAndUpdate(ticket.userId._id, {
        $push: {
          notifications: {
            $each: [{
              type: 'info',
              title: `${replyerRole} Reply: ${ticket.subject}`,
              message: `${replyerRole} replied: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
              isRead: false,
              date: new Date()
            }],
            $position: 0
          }
        }
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/tickets/:id/status
exports.updateTicketStatus = async (req, res) => {
  try {
    const updateData = { 
      status: req.body.status,
      lastActivityAt: new Date()
    };
    
    if (req.body.status === 'resolved' || req.body.status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('userId', 'name email role');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    // Notify user when ticket status changes
    if ((req.body.status === 'resolved' || req.body.status === 'closed') && ticket.userId) {
      await User.findByIdAndUpdate(ticket.userId._id, {
        $push: {
          notifications: {
            $each: [{
              type: 'success',
              title: `Ticket ${req.body.status === 'resolved' ? 'Resolved' : 'Closed'}: ${ticket.subject}`,
              message: `Your support ticket has been ${req.body.status} by the admin.`,
              isRead: false,
              date: new Date()
            }],
            $position: 0
          }
        }
      });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/tickets/:id/assign
exports.assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, lastActivityAt: new Date() },
      { new: true }
    ).populate('userId', 'name email role').populate('assignedTo', 'name role');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/tickets/stats
exports.getTicketStats = async (req, res) => {
  try {
    const [total, open, inProgress, resolved, byRole, byPriority] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.aggregate([
        { $group: { _id: '$userRole', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $match: { status: { $in: ['open', 'in_progress'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        byRole: byRole.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
