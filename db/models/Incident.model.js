const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  alert_id: { type: String, required: true, unique: true },
  service: { type: String, required: true },
  title: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high'
  },
  fired_at: { type: Date, required: true },
  resolved_at: { type: Date },

  // Agent outputs
  error_signature: { type: String },
  stack_trace: { type: String },
  root_cause: { type: String },
  root_cause_confidence: { 
    type: String, 
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'LOW'
  },
  suspect_file: { type: String },
  suspect_commit: { type: String },
  commit_author: { type: String },

  // Fix metadata
  fix_applied: { type: Boolean, default: false },
  pr_url: { type: String },
  pr_number: { type: Number },
  pr_merged: { type: Boolean, default: false },
  time_to_pr_ms: { type: Number }, // milliseconds from alert to PR open

  // Pipeline state
  pipeline_stage: { 
    type: String,
    enum: [
      'triggered',
      'investigating',
      'root_cause_found',
      'fix_written',
      'tests_passed',
      'pr_opened',
      'merged',
      'halted'
    ],
    default: 'triggered'
  },
  halt_reason: { type: String },
  bob_audit_log: [{ 
    timestamp: { type: Date, default: Date.now },
    action: String,
    result: String 
  }],
}, { 
  timestamps: true 
});

// Index for History Agent pattern matching
IncidentSchema.index({ error_signature: 'text', service: 1 });
IncidentSchema.index({ fired_at: -1 });

// Virtual for time to PR in human-readable format
IncidentSchema.virtual('time_to_pr_formatted').get(function() {
  if (!this.time_to_pr_ms) return null;
  const seconds = Math.floor(this.time_to_pr_ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
});

// Method to add audit log entry
IncidentSchema.methods.addAuditLog = function(action, result) {
  this.bob_audit_log.push({
    timestamp: new Date(),
    action,
    result
  });
  return this.save();
};

// Method to update pipeline stage
IncidentSchema.methods.updateStage = function(stage, additionalData = {}) {
  this.pipeline_stage = stage;
  Object.assign(this, additionalData);
  return this.save();
};

module.exports = mongoose.model('Incident', IncidentSchema);

// Made with Bob
