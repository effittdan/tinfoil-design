import { database, schema, rateSchema } from "../server/db.mjs";
await database().query(schema);
await database().query(rateSchema);
await database().end();
console.log("Order and webhook tables ready.");
