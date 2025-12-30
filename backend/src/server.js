/**
 * ============================================================
 * NEUROFOCUS AI - MISSION CONTROL SERVER
 * ============================================================
 * Cognitive-Adaptive ADHD Screening with DSM-5 Analysis Engine
 * 
 * FEATURES:
 * - 6-Phase "Sector" screening system (Narrative Quests)
 * - Real-time impulsivity detection (Cool Down trigger)
 * - Focus Meter scoring (specific example detection)
 * - DSM-5 severity marker analysis
 * - Age-based diagnostic thresholds
 * - ADHD presentation type calculation (ADHD-C, ADHD-I, ADHD-HI)
 * - PDF clinical report generation
 * ============================================================
 */

const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');

const PHASES = require('./config/phases');

// ==================== START SERVER ====================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(config.PORT, () => {
      console.log(`
====================================================
   🚀 NEUROFOCUS AI - MISSION CONTROL SERVER
   Cognitive-Adaptive ADHD Screening System
====================================================

   Mission Sectors (${PHASES.length} Phases):
   👋 Alpha: First Contact (${PHASES[0].color})
   🎯 Beta: Attention Systems (${PHASES[1].color})
   ⚡ Gamma: Power Systems (${PHASES[2].color})
   ⏱️ Delta: Control Systems (${PHASES[3].color})
   💭 Epsilon: Emotional Systems (${PHASES[4].color})
   ⭐ Omega: Mission Complete (${PHASES[5].color})

   🧠 Cognitive Adaptive Features:
   - Focus Meter (specific example detection)
   - Impulsivity Detection (Cool Down trigger)
   - DSM-5 Analysis Engine
   - Age-based diagnostic thresholds

   📡 API: http://localhost:${config.PORT}
   🎨 Frontend: ${config.CORS_ORIGIN}
   📊 Mode: ${config.DEMO_MODE ? 'DEMO' : 'LIVE (OpenAI connected)'}
   🌍 Environment: ${config.NODE_ENV}
====================================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
