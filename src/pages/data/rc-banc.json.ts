// Cours Reservoir computing, chapitre 11 : poids du réservoir du banc de poissons (calculés à la construction, train.ts),
// chargés par le widget Banc.astro quand il approche de l'écran (environ 640 Ko).
import { getBanc } from '../../components/rc/11-conceptors/banc/train';

export const GET = () => new Response(JSON.stringify(getBanc()), { headers: { 'Content-Type': 'application/json' } });
