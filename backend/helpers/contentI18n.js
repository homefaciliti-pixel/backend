/**
 * Content Localizer — adds multilingual columns to node_categories & node_services
 * and provides a helper to pick the right language for any DB row field.
 *
 * Supported languages: en, hi, mr, gu, bn, ta, te
 * Column convention: <field>_<lang>  e.g.  title_hi, description_mr
 */

const SUPPORTED_LANGS = ['hi', 'mr', 'gu', 'bn', 'ta', 'te'];

/**
 * Given a DB row and a field name (e.g. "title"), return the value
 * for the requested language falling back to the base English field.
 *
 * @param {object} row   - DB row object
 * @param {string} field - base field name ("title", "description", etc.)
 * @param {string} lang  - language code e.g. "hi"
 * @returns {string}
 */
function localizeField(row, field, lang) {
  if (!row || !field) return '';
  const normalizedLang = (lang || 'en').toLowerCase().trim();
  if (normalizedLang !== 'en' && SUPPORTED_LANGS.includes(normalizedLang)) {
    const localizedKey = `${field}_${normalizedLang}`;
    const localizedValue = row[localizedKey];
    if (localizedValue && String(localizedValue).trim() !== '') {
      return String(localizedValue).trim();
    }
  }
  // Fall back to base field
  return row[field] || '';
}

/**
 * Localize a category row — returns a new object with title in the right language.
 */
function localizeCategory(row, lang) {
  if (!row) return row;
  return {
    ...row,
    name: localizeField(row, 'name', lang) || localizeField(row, 'title', lang) || row.name || row.title || '',
    title: localizeField(row, 'title', lang) || localizeField(row, 'name', lang) || row.title || row.name || ''
  };
}

/**
 * Localize a service row — returns a new object with title & description in the right language.
 */
function localizeService(row, lang) {
  if (!row) return row;
  return {
    ...row,
    title: localizeField(row, 'title', lang) || row.title || '',
    description: localizeField(row, 'description', lang) || row.description || ''
  };
}

/**
 * Run DB migration to add multilingual columns to node_categories and node_services.
 * Safe to call on every server start — uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
 */
async function runContentI18nMigration(pool) {
  if (!pool) return;

  const tables = [
    { table: 'node_categories', fields: ['title', 'name'] },
    { table: 'node_services',   fields: ['title', 'description'] }
  ];

  for (const { table, fields } of tables) {
    // Check if table exists first
    try {
      const [tableCheck] = await pool.query(
        `SELECT COUNT(*) as cnt FROM information_schema.tables 
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [table]
      );
      if (!tableCheck[0] || tableCheck[0].cnt === 0) {
        console.log(`[i18n] Table ${table} does not exist, skipping migration.`);
        continue;
      }
    } catch (e) {
      console.warn(`[i18n] Could not check table ${table}:`, e.message);
      continue;
    }

    for (const field of fields) {
      for (const lang of SUPPORTED_LANGS) {
        const col = `${field}_${lang}`;
        try {
          // Check if column exists
          const [colCheck] = await pool.query(
            `SELECT COUNT(*) as cnt FROM information_schema.columns 
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
            [table, col]
          );
          if (colCheck[0] && colCheck[0].cnt === 0) {
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` TEXT NULL DEFAULT NULL`);
            console.log(`[i18n] Added column ${col} to ${table}`);
          }
        } catch (err) {
          console.warn(`[i18n] Could not add column ${col} to ${table}:`, err.message);
        }
      }
    }
  }
  console.log('[i18n] Content localization migration complete.');
}

module.exports = { localizeField, localizeCategory, localizeService, runContentI18nMigration, SUPPORTED_LANGS };
