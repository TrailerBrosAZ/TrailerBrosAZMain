import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const requiredTables = [
  "trailers",
  "customers",
  "reservations",
  "availability_blocks",
  "checkout_holds",
  "payments",
  "payment_ledger_entries",
  "payment_webhook_events",
  "audit_events",
  "condition_inspections",
  "inspection_photos",
  "cancellation_outcomes",
  "deposit_decisions",
  "booking_intents",
  "agreement_templates",
  "agreement_instances",
  "agreement_documents",
  "pickup_condition_choices",
  "booking_intent_conversions",
  "direct_checkout_sessions",
  "direct_checkout_agreements",
  "secure_links",
  "secure_link_attempts",
  "communication_records",
  "gmail_oauth_states",
  "gmail_connections",
  "gmail_delivery_attempts",
];
const scheduleTriggers = [
  "reservations_no_overlap_insert",
  "reservations_no_overlap_update",
  "blocks_no_overlap_insert",
  "blocks_no_overlap_update",
];
const communicationTriggers = [
  "communication_content_immutable_update",
  "communication_record_immutable_delete",
];
const directCheckoutTriggers = [
  "direct_checkout_agreement_immutable_update",
  "direct_checkout_agreement_immutable_delete",
];
const forbidden =
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|(?:client_secret|api[_-]?token|access_aud|access_team_domain)\s*[=:]/i;
export type BackupVerification = {
  sha256: string;
  bytes: number;
  tableCount: number;
  triggerCount: number;
  counts: Record<string, number>;
  syntheticReservations: number;
  syntheticBlocks: number;
};
const restoreOrder = [
  "d1_migrations",
  "trailers",
  "customers",
  "booking_intents",
  "checkout_holds",
  "reservations",
  "availability_blocks",
  "delivery_quote_usage",
  "secure_link_attempts",
  "payments",
  "payment_ledger_entries",
  "payment_webhook_events",
  "agreement_templates",
  "attorney_approval_records",
  "agreement_instances",
  "agreement_documents",
  "pickup_condition_choices",
  "booking_intent_conversions",
  "communication_records",
  "direct_checkout_sessions",
  "direct_checkout_agreements",
  "secure_links",
  "gmail_oauth_states",
  "gmail_connections",
  "gmail_delivery_attempts",
  "audit_events",
  "condition_inspections",
  "inspection_photos",
  "cancellation_outcomes",
  "deposit_decisions",
];
const quote = (value: unknown) => {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  if (Buffer.isBuffer(value))
    throw new Error(
      "Binary backup values require a separately reviewed storage design.",
    );
  return `'${String(value).replaceAll("'", "''")}'`;
};
export function createRestorableD1Backup(input: string, output: string) {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = OFF");
    db.exec(readFileSync(resolve(input), "utf8"));
    const present = (
      db
        .prepare(
          "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        )
        .all() as { name: string }[]
    ).map((row) => row.name);
    const unknown = present.filter((name) => !restoreOrder.includes(name));
    if (unknown.length)
      throw new Error(
        `Backup contains unrecognized tables: ${unknown.join(", ")}.`,
      );
    const schema = restoreOrder
      .filter((name) => present.includes(name))
      .map(
        (name) =>
          (
            db
              .prepare(
                "SELECT sql FROM sqlite_schema WHERE type='table' AND name=?",
              )
              .get(name) as { sql: string }
          ).sql + ";",
      );
    const inserts = restoreOrder
      .filter((name) => present.includes(name))
      .flatMap((name) =>
        (
          db.prepare(`SELECT * FROM "${name}"`).all() as Record<
            string,
            unknown
          >[]
        ).map(
          (row) =>
            `INSERT INTO "${name}" (${Object.keys(row)
              .map((key) => `"${key}"`)
              .join(
                ",",
              )}) VALUES (${Object.values(row).map(quote).join(",")});`,
        ),
      );
    const finishing = (
      db
        .prepare(
          "SELECT sql FROM sqlite_schema WHERE type IN ('index','trigger') AND sql IS NOT NULL ORDER BY type,name",
        )
        .all() as { sql: string }[]
    ).map((row) => row.sql + ";");
    writeFileSync(
      resolve(output),
      [
        "PRAGMA defer_foreign_keys=TRUE;",
        ...schema,
        ...inserts,
        ...finishing,
      ].join("\n"),
    );
  } finally {
    db.close();
  }
}
export function verifyD1Backup(
  file: string,
  options: {
    preBookingFoundation?: boolean;
    preAgreementFoundation?: boolean;
    preConversionFoundation?: boolean;
    preSecureLinkFoundation?: boolean;
    preAgreementRenderer?: boolean;
    preCommunicationsFoundation?: boolean;
  } = {},
): BackupVerification {
  const sql = readFileSync(resolve(file), "utf8");
  if (forbidden.test(sql))
    throw new Error(
      "Backup contains configuration or credential-shaped content.",
    );
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = OFF");
    db.exec(sql);
    db.pragma("foreign_keys = ON");
    if ((db.pragma("integrity_check", { simple: true }) as string) !== "ok")
      throw new Error("SQLite integrity check failed.");
    if ((db.pragma("foreign_key_check") as unknown[]).length)
      throw new Error("Foreign-key verification failed.");
    const names = (
      db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all() as {
        name: string;
      }[]
    ).map((row) => row.name);
    const triggers = (
      db
        .prepare("SELECT name FROM sqlite_schema WHERE type='trigger'")
        .all() as { name: string }[]
    ).map((row) => row.name);
    let expected = options.preBookingFoundation
      ? requiredTables.filter(
          (name) =>
            ![
              "booking_intents",
              "booking_intent_conversions",
              "secure_links",
              "secure_link_attempts",
              "agreement_documents",
            ].includes(name),
        )
      : options.preAgreementFoundation
        ? requiredTables.filter(
            (name) =>
              ![
                "agreement_templates",
                "agreement_instances",
                "agreement_documents",
                "pickup_condition_choices",
                "booking_intent_conversions",
                "secure_links",
                "secure_link_attempts",
              ].includes(name),
          )
        : options.preConversionFoundation
          ? requiredTables.filter(
              (name) =>
                ![
                  "booking_intent_conversions",
                  "secure_links",
                  "secure_link_attempts",
                  "agreement_documents",
                ].includes(name),
            )
          : options.preSecureLinkFoundation
            ? requiredTables.filter(
                (name) =>
                  ![
                    "secure_links",
                    "secure_link_attempts",
                    "agreement_documents",
                  ].includes(name),
              )
            : options.preAgreementRenderer ||
                (!names.includes("d1_migrations") &&
                  !names.includes("agreement_documents"))
              ? requiredTables.filter((name) => name !== "agreement_documents")
              : requiredTables;
    expected = expected
      .filter(
        (name) => name !== "communication_records" || names.includes(name),
      )
      .filter(
        (name) =>
          !["payment_ledger_entries", "payment_webhook_events"].includes(
            name,
          ) || names.includes(name),
      );
    if (!names.some((name) => name.startsWith("gmail_")))
      expected = expected.filter((name) => !name.startsWith("gmail_"));
    if (!names.includes("direct_checkout_sessions"))
      expected = expected.filter(
        (name) => !name.startsWith("direct_checkout_"),
      );
    if (!names.includes("checkout_holds"))
      expected = expected.filter((name) => name !== "checkout_holds");
    const communicationColumns = names.includes("communication_records")
      ? (
          db.prepare("PRAGMA table_info(communication_records)").all() as {
            name: string;
          }[]
        ).map((row) => row.name)
      : [];
    const preCommunications =
      options.preCommunicationsFoundation ||
      !communicationColumns.includes("source_template_hash");
    const requiredTriggers = [
      ...scheduleTriggers,
      ...(preCommunications ? [] : communicationTriggers),
      ...(names.includes("direct_checkout_agreements")
        ? directCheckoutTriggers
        : []),
    ];
    const missingTables = expected.filter((name) => !names.includes(name));
    const missingTriggers = requiredTriggers.filter(
      (name) => !triggers.includes(name),
    );
    if (missingTables.length || missingTriggers.length)
      throw new Error(
        `Backup schema is incomplete (${missingTables.length} tables, ${missingTriggers.length} triggers missing).`,
      );
    const counts = Object.fromEntries(
      expected.map((name) => [
        name,
        Number(
          (
            db.prepare(`SELECT count(*) total FROM ${name}`).get() as {
              total: number;
            }
          ).total,
        ),
      ]),
    );
    return {
      sha256: createHash("sha256").update(sql).digest("hex"),
      bytes: Buffer.byteLength(sql),
      tableCount: expected.length,
      triggerCount: requiredTriggers.length,
      counts,
      syntheticReservations: Number(
        (
          db
            .prepare(
              "SELECT count(*) total FROM reservations WHERE is_synthetic=1",
            )
            .get() as { total: number }
        ).total,
      ),
      syntheticBlocks: Number(
        (
          db
            .prepare(
              "SELECT count(*) total FROM availability_blocks WHERE is_synthetic=1",
            )
            .get() as { total: number }
        ).total,
      ),
    };
  } finally {
    db.close();
  }
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const file = process.argv[2];
  if (!file)
    throw new Error("Usage: npm run backup:verify -- <path-to-export.sql>");
  const result = verifyD1Backup(file, {
    preBookingFoundation: process.argv.includes("--pre-booking-foundation"),
    preAgreementFoundation: process.argv.includes("--pre-agreement-foundation"),
    preConversionFoundation: process.argv.includes(
      "--pre-conversion-foundation",
    ),
    preSecureLinkFoundation: process.argv.includes(
      "--pre-secure-link-foundation",
    ),
    preAgreementRenderer: process.argv.includes("--pre-agreement-renderer"),
    preCommunicationsFoundation: process.argv.includes(
      "--pre-communications-foundation",
    ),
  });
  console.log(JSON.stringify({ verified: true, ...result }));
}
