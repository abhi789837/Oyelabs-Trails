/**
 * Rehearses the v4 upgrade on a COPY of a database file and prints before/after counts.
 *
 *   npx tsx scripts/v4/rehearse-migration.ts path/to/oyelearn.db
 *
 * Exit code 1 if any personal table lost rows or a learner did not land in a department.
 */
import { rehearseMigration } from "../../server/src/db/migrateV4";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx scripts/v4/rehearse-migration.ts <db file>");
  process.exit(2);
}
const report = rehearseMigration(file);
console.log(JSON.stringify(report, null, 2));
const ok = report.lost.length === 0 && report.learnersInEngineering === report.learners;
console.log(ok ? "OK: no data lost; every learner is in a department." : "PROBLEM: see above.");
process.exit(ok ? 0 : 1);
