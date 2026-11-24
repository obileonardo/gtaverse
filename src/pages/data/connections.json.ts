// /data/connections.json: GTAverse connections with licence header and sources (src/lib/opendata.ts).
import { connectionsFile, json } from '../../lib/opendata';
export const GET = () => json(connectionsFile());
