// Deprecated: notice endpoints moved into index.js. This file retained only as a placeholder to avoid confusion.

// Delete a notice
// DELETE /api/notices/:noticeId
app.delete('/api/notices/:noticeId', authenticateToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.noticeId);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const isAuthor = notice.author && notice.author.toString() === req.user._id.toString();
    let isManagerOfBuilding = false;
    if (req.user.role === 'manager') {
      const Building = require('./models/Building');
      const building = await Building.findById(notice.building);
      if (building && building.manager && building.manager.toString() === req.user._id.toString()) {
        isManagerOfBuilding = true;
      }
    }
    if (!isAuthor && !isManagerOfBuilding) {
      return res.status(403).json({ message: 'Not authorized to delete this notice.' });
    }
    await notice.deleteOne();
    res.json({ message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
