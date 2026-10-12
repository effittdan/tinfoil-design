import { createHash } from "node:crypto";
import { database } from "./db.mjs";
import { PublicError } from "./validation.mjs";
export async function limitQuotes(ip) {
  const key = createHash("sha256")
    .update("quote:" + ip + ":" + Math.floor(Date.now() / 3600000))
    .digest("hex");
  const {
    rows: [row],
  } = await database().query(
    "INSERT INTO tinfoil_rate_limits(key,hits) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET hits=tinfoil_rate_limits.hits+1 RETURNING hits",
    [key],
  );
  if (row.hits > 20)
    throw new PublicError(
      "Too many shipping requests. Please try again later.",
      429,
    );
}
