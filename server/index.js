require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../db/connect');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'DevOps Oracle'
  });
});

// Routes
app.use('/webhook', webhookRoutes);

// API routes for dashboard
app.get('/api/incidents', async (req, res) => {
  try {
    const Incident = require('../db/models/Incident.model');
    const incidents = await Incident.find()
      .sort({ fired_at: -1 })
      .limit(50);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const Incident = require('../db/models/Incident.model');
    const incident = await Incident.findOne({ alert_id: req.params.id });
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const Incident = require('../db/models/Incident.model');
    const incidents = await Incident.find();
    
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.pr_merged).length;
    const avgTimeToPR = incidents
      .filter(i => i.time_to_pr_ms)
      .reduce((sum, i) => sum + i.time_to_pr_ms, 0) / 
      (incidents.filter(i => i.time_to_pr_ms).length || 1);
    
    res.json({
      total_incidents: totalIncidents,
      resolved_incidents: resolvedIncidents,
      success_rate: totalIncidents > 0 ? (resolvedIncidents / totalIncidents * 100).toFixed(2) : 0,
      avg_time_to_pr_seconds: Math.round(avgTimeToPR / 1000),
      avg_time_to_pr_minutes: (avgTimeToPR / 60000).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 DevOps Oracle server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook/pagerduty`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

// Made with Bob
