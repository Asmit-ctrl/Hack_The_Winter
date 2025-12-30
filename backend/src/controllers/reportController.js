/**
 * Report Controller
 * Handles PDF report generation
 */

const { Conversation } = require('../models');
const { PDFReportGenerator } = require('../services');

/**
 * Download PDF report
 */
const downloadReport = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'No active session' });
    }
    
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    // Generate PDF report
    PDFReportGenerator.generateReport(conversation, res);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  downloadReport
};
