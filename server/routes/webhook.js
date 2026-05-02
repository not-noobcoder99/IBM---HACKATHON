const express = require('express');
const router = express.Router();
const Incident = require('../../db/models/Incident.model');
const { triggerOrchestrator } = require('../orchestrator');

// PagerDuty webhook endpoint
router.post('/pagerduty', async (req, res) => {
  try {
    console.log('📨 Webhook received from PagerDuty');
    
    // Respond immediately to prevent timeout
    res.status(200).json({ received: true, timestamp: new Date().toISOString() });
    
    // Process webhook asynchronously
    processWebhook(req.body).catch(err => {
      console.error('Error processing webhook:', err);
    });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate alert endpoint for demo
router.post('/simulate', async (req, res) => {
  try {
    console.log('🎭 Simulating alert for demo');
    
    const demoAlert = {
      messages: [{
        event: {
          id: `INC-DEMO-${Date.now()}`,
          data: {
            id: `INC-DEMO-${Date.now()}`,
            title: req.body.title || 'NullPointerException in OrderService.processRefund()',
            urgency: req.body.urgency || 'high',
            service: { summary: req.body.service || 'order-service' },
            created_at: new Date().toISOString(),
            body: {
              details: {
                logs_url: req.body.logs_url || 'http://localhost:3001/mock-logs/demo'
              }
            }
          }
        }
      }]
    };
    
    res.status(200).json({ 
      received: true, 
      alert_id: demoAlert.messages[0].event.id,
      message: 'Demo alert triggered'
    });
    
    // Process the simulated alert
    processWebhook(demoAlert).catch(err => {
      console.error('Error processing simulated alert:', err);
    });
    
  } catch (error) {
    console.error('Simulate endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process webhook payload
async function processWebhook(payload) {
  try {
    // Extract alert data from PagerDuty payload
    const message = payload.messages?.[0];
    if (!message) {
      console.log('⚠️  No messages in webhook payload');
      return;
    }
    
    const event = message.event;
    const data = event.data;
    
    const alertData = {
      alert_id: data.id,
      service: data.service?.summary || 'unknown',
      title: data.title,
      severity: data.urgency || 'high',
      fired_at: new Date(data.created_at),
      logs_url: data.body?.details?.logs_url || null,
      pipeline_stage: 'triggered'
    };
    
    console.log('📋 Alert data extracted:', {
      id: alertData.alert_id,
      service: alertData.service,
      title: alertData.title
    });
    
    // Save incident to database
    let incident;
    try {
      incident = await Incident.create(alertData);
      console.log('💾 Incident saved to database');
    } catch (dbError) {
      console.warn('⚠️  Database save failed, continuing without persistence:', dbError.message);
      incident = alertData; // Use in-memory object if DB fails
    }
    
    // Add audit log entry
    if (incident.addAuditLog) {
      await incident.addAuditLog('webhook_received', 'Alert data extracted and saved');
    }
    
    // Trigger Bob Orchestrator
    console.log('🤖 Triggering Bob Orchestrator...');
    await triggerOrchestrator(alertData);
    
  } catch (error) {
    console.error('❌ Error in processWebhook:', error);
    throw error;
  }
}

module.exports = router;

// Made with Bob
