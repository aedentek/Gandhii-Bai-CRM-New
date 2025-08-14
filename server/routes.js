module.exports = function(app, db) {
  // --- LEAD CATEGORIES CRUD ENDPOINTS ---
  // Get all lead categories
  app.get('/api/lead-categories', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM lead_categories');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add other routes from index.js here...
  
  return app;
};
