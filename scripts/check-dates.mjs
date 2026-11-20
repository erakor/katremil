// Verifies week boundaries are identical across time zones, including DST changes.
import * as d from "../src/lib/dates.ts";

const probes = ["2026-03-07", "2026-03-08", "2026-03-09", "2026-11-01", "2026-11-02", "2026-09-27", "2026-04-05", "2000-02-29"];
const start = d.mondayOf("1990-06-15");
const out = probes.map((p) => [p, d.mondayOf(p), d.weeksBetween(start, p), d.weekId(p), d.formatRange(d.mondayOf(p), d.addDays(d.mondayOf(p), 6))]);
let weeks = 0;
for (let i = 0; i < 4000; i++) weeks += d.weekId(d.addWeeks(start, i)) - d.weekId(start) === i ? 0 : 1;
out.push(["sequential-mismatches", weeks]);
console.log(JSON.stringify(out));
