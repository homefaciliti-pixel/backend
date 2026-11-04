require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./app');
const { PORT } = require('./config/constants');
const { initMySqlDbWithRetry, initJsonDb, getMysqlReady, getMysqlPool, setDbMode, setMysqlReady } = require('./config/db');
const { runContentI18nMigration } = require('./helpers/contentI18n');

(async () => {
  const mysqlSuccess = await initMySqlDbWithRetry();
  if (!mysqlSuccess) {
    setDbMode("json");
    setMysqlReady(false);
    initJsonDb();
  }
  const poolForExtras = getMysqlReady() ? getMysqlPool() : null;
  if (getMysqlReady() && poolForExtras) {
    try {
      const { initTranslationEngine } = require('./helpers/translate');
      await initTranslationEngine(poolForExtras);
    } catch (err) {
      console.error("Failed to initialize translation engine in startup IIFE:", err.message);
    }
    try {
      await runContentI18nMigration(poolForExtras);
    } catch (err) {
      console.error("Failed to run content i18n migration in startup IIFE:", err.message);
    }
  } else {
    console.log("MySQL unavailable on startup. Skipping translation engine DB setup and running in pure JSON database mode.");
  }

  app.listen(PORT, () => {
    console.log(`Backend server successfully listening at http://localhost:${PORT}`);
  });
})();
