const fs = require('fs').promises;
const path = require('path');
const Incident = require('../db/models/Incident.model');

/**
 * Trigger Bob Orchestrator to handle incident investigation
 * @param {Object} alertData - The alert data from PagerDuty
 */
async function triggerOrchestrator(alertData) {
  try {
    console.log('🔮 DevOps Oracle activated for:', alertData.title);
    
    // Load orchestrator prompt template
    const promptPath = path.join(__dirname, '../bob-prompts/orchestrator.md');
    let promptTemplate = await fs.readFile(promptPath, 'utf-8');
    
    // Replace placeholders with actual alert data
    promptTemplate = promptTemplate
      .replace(/{{alert\.id}}/g, alertData.alert_id)
      .replace(/{{alert\.service}}/g, alertData.service)
      .replace(/{{alert\.title}}/g, alertData.title)
      .replace(/{{alert\.severity}}/g, alertData.severity)
      .replace(/{{alert\.fired_at}}/g, alertData.fired_at)
      .replace(/{{alert\.logs_url}}/g, alertData.logs_url || 'N/A');
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 ORCHESTRATOR PROMPT');
    console.log('='.repeat(80));
    console.log(promptTemplate);
    console.log('='.repeat(80) + '\n');
    
    // Update incident stage
    try {
      await Incident.findOneAndUpdate(
        { alert_id: alertData.alert_id },
        { 
          pipeline_stage: 'investigating',
          $push: {
            bob_audit_log: {
              timestamp: new Date(),
              action: 'orchestrator_triggered',
              result: 'Investigation started'
            }
          }
        }
      );
    } catch (dbError) {
      console.warn('⚠️  Could not update incident in database:', dbError.message);
    }
    
    // In a real implementation, this would trigger Bob via API or CLI
    // For now, we'll simulate the investigation process
    console.log('🤖 Bob Orchestrator would now:');
    console.log('  1. Dispatch Log Agent to analyze logs');
    console.log('  2. Dispatch Repo Agent to trace code');
    console.log('  3. Synthesize root cause');
    console.log('  4. Generate fix in Code mode');
    console.log('  5. Run tests in Advanced mode');
    console.log('  6. Create PR via GitHub MCP');
    
    console.log('\n💡 To actually trigger Bob, you would run:');
    console.log(`   bob orchestrate --prompt="${promptPath}" --context='${JSON.stringify(alertData)}'`);
    
    return {
      success: true,
      alert_id: alertData.alert_id,
      message: 'Orchestrator triggered successfully'
    };
    
  } catch (error) {
    console.error('❌ Orchestrator error:', error);
    
    // Update incident with error
    try {
      await Incident.findOneAndUpdate(
        { alert_id: alertData.alert_id },
        { 
          pipeline_stage: 'halted',
          halt_reason: error.message,
          $push: {
            bob_audit_log: {
              timestamp: new Date(),
              action: 'orchestrator_error',
              result: error.message
            }
          }
        }
      );
    } catch (dbError) {
      console.warn('⚠️  Could not update incident error in database');
    }
    
    throw error;
  }
}

/**
 * Load a Bob prompt template and populate with data
 * @param {string} promptName - Name of the prompt file (without .md extension)
 * @param {Object} data - Data to populate the template
 */
async function loadPrompt(promptName, data = {}) {
  try {
    const promptPath = path.join(__dirname, `../bob-prompts/${promptName}.md`);
    let template = await fs.readFile(promptPath, 'utf-8');
    
    // Replace all placeholders
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value);
    }
    
    return template;
  } catch (error) {
    console.error(`Error loading prompt ${promptName}:`, error);
    throw error;
  }
}

module.exports = {
  triggerOrchestrator,
  loadPrompt
};

// Made with Bob
