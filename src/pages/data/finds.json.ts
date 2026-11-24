// /data/finds.json: published finds with licence header and credits (src/lib/opendata.ts).
import { findsFile, json } from '../../lib/opendata';
export const GET = () => json(findsFile());
