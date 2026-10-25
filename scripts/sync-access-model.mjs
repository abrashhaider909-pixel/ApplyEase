/**
 * Sync the access model to the connected Supabase project.
 * ---------------------------------------------------------------------------
 * Idempotent. Applies the parts of the seed data that changed when signing
 * authority moved to department heads:
 *
 *   - adds the University Registrar as a staff officer (registrar stages were
 *     previously assigned to the administrator, who may no longer sign)
 *   - re-points registrar workflow stages to that officer
 *   - issues the finance department's signature and seal
 *
 * Run:  npx tsx scripts/sync-access-model.mjs
 */

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_USERS,
  INITIAL_SIGNATURES,
  INITIAL_STAMPS,
  INITIAL_APPLICATION_TYPES
} from '../src/lib/constants.ts';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(line => line && !line.trim().startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"|"$/g, '')];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('✗ Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const profileRow = u => ({
  id: u.id,
  name: u.name,
  email: u.email.toLowerCase(),
  password: u.password || '123',
  role: u.role,
  avatar_url: u.avatarUrl ?? null,
  registration_number: u.registrationNumber ?? null,
  department: u.department,
  designation: u.designation ?? null,
  phone: u.phone,
  semester: u.semester ?? null,
  hostel_room: u.hostelRoom ?? null,
  active: u.active
});

const signatureRow = s => ({
  id: s.id,
  name: s.name,
  image_url: s.imageUrl,
  original_image_url: s.originalImageUrl,
  owner_name: s.ownerName,
  owner_role: s.ownerRole,
  department: s.department,
  is_transparent: s.isTransparent,
  opacity: s.opacity,
  active: s.active,
  created_at: s.createdAt,
  audit_hash: s.auditHash
});

const stampRow = s => ({
  id: s.id,
  name: s.name,
  image_url: s.imageUrl,
  original_image_url: s.originalImageUrl,
  department: s.department,
  is_transparent: s.isTransparent,
  opacity: s.opacity,
  active: s.active,
  created_at: s.createdAt,
  audit_hash: s.auditHash
});

let failures = 0;
const report = (label, error) => {
  if (error) {
    failures += 1;
    console.log(`✗ ${label} — ${error.message}`);
  } else {
    console.log(`✓ ${label}`);
  }
};

// 1. Registrar officer
const registrar = INITIAL_USERS.find(u => u.id === 'staff-registrar');
if (registrar) {
  const { error } = await supabase.from('profiles').upsert([profileRow(registrar)], { onConflict: 'id' });
  report(`profile ${registrar.email}`, error);
}

// 2. Finance signature + seal
const sterling = INITIAL_SIGNATURES.find(s => s.id === 'sig-sterling');
if (sterling) {
  const { error } = await supabase.from('signature_assets').upsert([signatureRow(sterling)], { onConflict: 'id' });
  report('signature sig-sterling', error);
}

const financeSeal = INITIAL_STAMPS.find(s => s.id === 'stamp-finance-seal');
if (financeSeal) {
  const { error } = await supabase.from('stamp_assets').upsert([stampRow(financeSeal)], { onConflict: 'id' });
  report('seal stamp-finance-seal', error);
}

// 3. Workflow assignments (registrar stages now belong to the registrar)
for (const type of INITIAL_APPLICATION_TYPES) {
  const { error } = await supabase
    .from('application_types')
    .update({ workflow_definition: type.workflowDefinition, updated_at: new Date().toISOString() })
    .eq('id', type.id);
  report(`workflow ${type.id}`, error);
}

// 4. Reconcile in-flight applications with their (possibly updated) workflow:
//    stage ownership and signature requirements must match the published route.
const { data: liveApps, error: liveError } = await supabase
  .from('applications')
  .select('id, reference_number, status, application_type_id, current_stage_index, stage_instances');

if (liveError) {
  report('read applications', liveError);
} else {
  for (const app of liveApps || []) {
    if (['completed', 'rejected', 'cancelled'].includes(app.status)) continue;
    const type = INITIAL_APPLICATION_TYPES.find(t => t.id === app.application_type_id);
    if (!type) continue;

    const byId = new Map(type.workflowDefinition.stages.map(stage => [stage.id, stage]));
    let touched = false;
    const stages = (app.stage_instances || []).map(stage => {
      const definition = byId.get(stage.stageId);
      if (!definition) return stage;
      const next = {
        ...stage,
        assignedDepartment: definition.assignedDepartment,
        assignedRole: definition.assignedRole,
        assignedStaffId: definition.assignedStaffId,
        assignedStaffName: INITIAL_USERS.find(u => u.id === definition.assignedStaffId)?.name,
        slaHours: definition.slaHours,
        requiresSignature: definition.requiresSignature,
        requiresStamp: definition.requiresStamp
      };
      if (JSON.stringify(next) !== JSON.stringify(stage)) touched = true;
      return next;
    });

    if (!touched) continue;
    const { error: appError } = await supabase
      .from('applications')
      .update({ stage_instances: stages, updated_at: new Date().toISOString() })
      .eq('id', app.id);
    report(`stages ${app.reference_number}`, appError);
  }
}

console.log('');
if (failures > 0) {
  console.error(`${failures} step(s) failed.`);
  process.exit(1);
}
console.log('Access model synced.');
