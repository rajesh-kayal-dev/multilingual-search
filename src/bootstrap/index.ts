import "./mongo-host-dns.js";
import { startAiSettingsSync } from "../ai/ai.settings.js";
import { upsertSynonyms } from "../modules/search/synonyms.js";
import { connectDatabase } from "./database.js";
import { DEV_ADMIN_KEY, env } from "./env.js";
import { connectKafka } from "./kafka.js";
import { logger } from "./logger.js";
import { ensureIndexes } from "./models.js";
import { connectRedis } from "./redis.js";
import { registerProcessHandlers } from "./shutdown.js";
import { connectTypesense, isTypesenseReady } from "./typesense.js";
export const bootstrap = async () => {
  registerProcessHandlers();
  logger.info("BOOT: Connecting database");
  await connectDatabase();
  logger.info("BOOT: Creating indexes");
  await ensureIndexes();
  logger.info("BOOT: Indexes completed");
  logger.info("BOOT: Connecting Redis");
  await connectRedis();
  logger.info("BOOT: Connecting Kafka");
  await connectKafka();
  logger.info("BOOT: Connecting Typesense");
  await connectTypesense();
  logger.info("BOOT: Starting AI settings sync");
  startAiSettingsSync();
  if (isTypesenseReady()) {
    void upsertSynonyms().catch((err: unknown) =>
      logger.warn(
        `synonyms: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
  }
  if (env.adminKeyIsDefault) {
    logger.warn(
      `ADMIN_KEY is not set: the admin pages use "${DEV_ADMIN_KEY}". Set ADMIN_KEY in .env.`,
    );
  }
  logger.info(`Bootstrap complete, env: ${env.nodeEnv}`);
  return { logger, env };
};
