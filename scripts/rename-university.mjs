/**
 * Rename the university from "Apex State University" to "MCS" in data that was
 * seeded before the rebrand.
 *
 * Code changes alone are not enough: document templates, seal artwork and cached
 * PDFs live in the database. This script rewrites the text fields and re-encodes
 * seal SVGs, then clears cached PDFs so they regenerate with the new name.
 *
 *   node --env-file=.env scripts/rename-university.mjs [--dry-run]
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(line => line.includes('=') && !line.trim().startsWith('#'))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, '')];
    })
);

const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const NEW_NAME = 'MCS';

function renameText(value) {
  if (typeof value !== 'string' || !/apex/i.test(value)) return value;
  return value
    .replace(/Apex State University/gi, NEW_NAME)
    .replace(/APEX STATE UNIVERSITY/gi, NEW_NAME)
    .replace(/apexstate\.edu/gi, 'mcs.edu')
    .replace(/\bApex\b/gi, NEW_NAME)
    .replace(/\bAPEX\b/g, NEW_NAME);
}

/** Seal artwork is a data URL holding raw SVG: rewrite its text then re-encode. */
function renameSvgSource(src) {
  if (typeof src !== 'string' || !/apex/i.test(decodeURIComponent(src))) return src;
  try {
    const comma = src.indexOf(',');
    if (comma < 0) return src;
    const meta = src.slice(0, comma);
    if (meta.includes('base64')) return src;
    let svg = decodeURIComponent(src.slice(comma + 1));
    if (svg.includes('\\"')) svg = svg.replace(/\\"/g, '"');
    svg = renameText(svg);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return src;
  }
}

function renameTemplate(template) {
  if (!template || typeof template !== 'object') return template;
  return {
    ...template,
    title: renameText(template.title),
    subtitle: renameText(template.subtitle),
    headerNotice: renameText(template.headerNotice),
    footerNotice: renameText(template.footerNotice),
    bodyParagraphs: Array.isArray(template.bodyParagraphs)
      ? template.bodyParagraphs.map(renameText)
      : template.bodyParagraphs
  };
}

let totals = { types: 0, stamp_assets: 0, signature_assets: 0, applications: 0 };

const { data: types, error: typesError } = await db
  .from('application_types')
  .select('id,title,description,form_config,document_template');
if (typesError) throw typesError;

for (const row of types ?? []) {
  const next = {
    title: renameText(row.title),
    description: renameText(row.description),
    form_config: row.form_config
      ? {
          ...row.form_config,
          title: renameText(row.form_config.title),
          description: renameText(row.form_config.description),
          instructions: renameText(row.form_config.instructions)
        }
      : row.form_config,
    document_template: renameTemplate(row.document_template)
  };
  // Only touch rows that genuinely contain the old name.
  const changed =
    next.title !== row.title ||
    next.description !== row.description ||
    JSON.stringify(next.form_config) !== JSON.stringify(row.form_config) ||
    JSON.stringify(next.document_template) !== JSON.stringify(row.document_template);
  if (!changed) continue;
  totals.types += 1;
  console.log(`${DRY_RUN ? '[dry] ' : ''}type "${row.title}" — template text rewritten`);
  if (!DRY_RUN) {
    const { error } = await db.from('application_types').update(next).eq('id', row.id);
    if (error) throw error;
  }
}

for (const table of ['stamp_assets', 'signature_assets']) {
  const { data: assets, error } = await db.from(table).select('*').limit(200);
  if (error) {
    console.warn(`skip ${table}: ${error.message}`);
    continue;
  }
  for (const asset of assets ?? []) {
    const next = {};
    for (const key of ['name', 'owner_name', 'owner_role']) {
      if (asset[key] && renameText(asset[key]) !== asset[key]) next[key] = renameText(asset[key]);
    }
    for (const key of ['image_url', 'original_image_url']) {
      if (asset[key] && renameSvgSource(asset[key]) !== asset[key]) next[key] = renameSvgSource(asset[key]);
    }
    if (Object.keys(next).length === 0) continue;
    totals[table] += 1;
    console.log(`${DRY_RUN ? '[dry] ' : ''}${table} ${asset.name || asset.id}: ${Object.keys(next).join(', ')}`);
    if (!DRY_RUN) {
      const { error: updateError } = await db.from(table).update(next).eq('id', asset.id);
      if (updateError) console.warn(`  could not update ${asset.id}: ${updateError.message}`);
    }
  }
}

// Cached PDFs embed the old wording; drop them so the renderer rebuilds on demand.
const { data: apps, error: appsError } = await db
  .from('applications')
  .select('id,reference_number,issued_document')
  .not('issued_document', 'is', null);
if (appsError) throw appsError;

for (const app of apps ?? []) {
  if (!app.issued_document) continue;
  totals.applications += 1;
  if (!DRY_RUN) {
    const { error } = await db
      .from('applications')
      .update({ issued_document: { ...app.issued_document, pdfDataUrl: null, pdfVersion: null } })
      .eq('id', app.id);
    if (error) throw error;
  }
}

console.log(`\n${DRY_RUN ? 'Would update' : 'Updated'}:`, totals);
console.log(
  DRY_RUN
    ? 'Dry run only — re-run without --dry-run to apply.'
    : 'Done. Documents regenerate with the new name on next download.'
);
