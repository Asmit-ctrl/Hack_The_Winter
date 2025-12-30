/**
 * NeuroNav - Report Service
 * Handles PDF report generation and download
 */

import api from './api';
import { API_CONFIG } from '../config';

const { ENDPOINTS } = API_CONFIG;

class ReportService {
  /**
   * Download PDF screening report
   * @param {string} sessionId - Optional session ID (uses current if not provided)
   * @returns {Promise<void>}
   */
  async downloadReport(sessionId = null) {
    try {
      const endpoint = sessionId 
        ? `${ENDPOINTS.REPORT.DOWNLOAD}?sessionId=${sessionId}`
        : ENDPOINTS.REPORT.DOWNLOAD;
      
      const filename = `NeuroNav_ADHD_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      
      await api.downloadFile(endpoint, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('[ReportService] Failed to download report:', error);
      throw error;
    }
  }

  /**
   * Get report preview data (without generating PDF)
   * @returns {Promise<object>} Report summary data
   */
  async getReportPreview() {
    try {
      const response = await api.get(ENDPOINTS.REPORT.PREVIEW);
      return {
        success: true,
        summary: response.summary,
        scores: response.scores,
        recommendations: response.recommendations
      };
    } catch (error) {
      console.error('[ReportService] Failed to get preview:', error);
      throw error;
    }
  }

  /**
   * Format DSM scores for display
   * @param {object} scores - Raw DSM scores
   * @returns {array} Formatted score items
   */
  formatScoresForDisplay(scores) {
    const labels = {
      inattention: 'Inattention',
      hyperactivity: 'Hyperactivity',
      impulsivity: 'Impulsivity',
      emotionalDysregulation: 'Emotional Regulation',
      functionalImpairment: 'Daily Impact'
    };

    const colors = {
      inattention: '#FF6B2C',
      hyperactivity: '#00D4FF',
      impulsivity: '#FFD93D',
      emotionalDysregulation: '#FF4757',
      functionalImpairment: '#A855F7'
    };

    return Object.entries(scores).map(([key, value]) => ({
      key,
      label: labels[key] || key,
      score: Math.round(value * 100) / 100,
      percentage: Math.min(100, Math.round(value * 10)),
      color: colors[key] || '#666666'
    }));
  }

  /**
   * Get severity level from overall score
   * @param {number} overallScore - Combined DSM score
   * @returns {object} Severity info
   */
  getSeverityLevel(overallScore) {
    if (overallScore >= 7) {
      return {
        level: 'significant',
        label: 'Significant Indicators Present',
        color: '#FF4757',
        recommendation: 'Professional evaluation strongly recommended'
      };
    } else if (overallScore >= 4) {
      return {
        level: 'moderate',
        label: 'Moderate Indicators Present',
        color: '#FFD93D',
        recommendation: 'Consider professional consultation'
      };
    } else {
      return {
        level: 'mild',
        label: 'Mild or Few Indicators',
        color: '#22C55E',
        recommendation: 'Continue monitoring, seek help if concerns persist'
      };
    }
  }
}

// Singleton instance
const reportService = new ReportService();
export default reportService;
