import { database, schema, rateSchema, formsSchema } from "../server/db.mjs";
await database().query(schema);
await database().query(rateSchema);
await database().query(formsSchema);
await database().end();
console.log("Order and webhook tables ready.");
