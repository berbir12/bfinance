import { readFileSync } from 'node:fs';
import pg from 'pg';

const values = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, '')];
    }),
);

const connectionUrl = new URL(values.POSTGRES_URL_NON_POOLING);
connectionUrl.searchParams.delete('sslmode');
const client = new pg.Client({ connectionString: connectionUrl.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

const signatures = {
  transactions: [
    ['beverage', 'income', 'sales', 126500, '2026-09-09'],
    ['farm', 'income', 'crop-sales', 186000, '2026-09-06'],
    ['beverage', 'expense', 'purchases', 118400, '2026-09-07'],
    ['farm', 'expense', 'fertilizer', 78500, '2026-09-03'],
    ['farm', 'expense', 'labor', 42900, '2026-09-01'],
    ['beverage', 'income', 'sales', 173750, '2026-08-25'],
  ],
  inventory: [
    ['beverage', 'Coca-Cola', 8, 620],
    ['beverage', 'Ambo', 34, 510],
    ['farm', null, 12, 4200],
    ['farm', null, 145, 185],
  ],
  parties: [
    ['beverage', 'customer', '0911 234 567', 68000, 43000],
    ['beverage', 'customer', '0912 765 432', 47500, 27500],
    ['farm', 'supplier', '011 445 6677', 98000, 63000],
    ['beverage', 'supplier', '011 661 2233', 142000, 106000],
  ],
  crops: [
    ['farm', '2026-05-18', '2026-10-20', 3.5, 6200],
    ['farm', '2026-07-02', '2026-11-12', 2, 2800],
  ],
};

const owner = await client.query("select id from auth.users where email = 'birhanukinfu@bereket.local' limit 1");
if (!owner.rowCount) throw new Error('birhanukinfu account not found.');
const ownerId = owner.rows[0].id;

const matches = {};
matches.transactions = (await client.query(
  `select id from public.transactions where owner_id=$1 and (business_id,type,category,amount,date::text) in (${signatures.transactions.map((_, index) => `($${index * 5 + 2},$${index * 5 + 3},$${index * 5 + 4},$${index * 5 + 5},$${index * 5 + 6})`).join(',')})`,
  [ownerId, ...signatures.transactions.flat()],
)).rows.map(row => row.id);
matches.inventory = (await client.query(
  `select id from public.inventory_items where owner_id=$1 and (business_id,coalesce(brand,''),quantity,purchase_price) in (${signatures.inventory.map((_, index) => `($${index * 4 + 2},$${index * 4 + 3},$${index * 4 + 4},$${index * 4 + 5})`).join(',')})`,
  [ownerId, ...signatures.inventory.flatMap(([business, brand, quantity, price]) => [business, brand ?? '', quantity, price])],
)).rows.map(row => row.id);
matches.parties = (await client.query(
  `select id from public.parties where owner_id=$1 and (business_id,type,phone,total,paid) in (${signatures.parties.map((_, index) => `($${index * 5 + 2},$${index * 5 + 3},$${index * 5 + 4},$${index * 5 + 5},$${index * 5 + 6})`).join(',')})`,
  [ownerId, ...signatures.parties.flat()],
)).rows.map(row => row.id);
matches.crops = (await client.query(
  `select id from public.crops where owner_id=$1 and (business_id,planting_date::text,harvest_date::text,area,expected_yield) in (${signatures.crops.map((_, index) => `($${index * 5 + 2},$${index * 5 + 3},$${index * 5 + 4},$${index * 5 + 5},$${index * 5 + 6})`).join(',')})`,
  [ownerId, ...signatures.crops.flat()],
)).rows.map(row => row.id);

console.log(JSON.stringify({ mode: process.argv.includes('--confirm') ? 'delete' : 'dry-run', matches }, null, 2));

if (process.argv.includes('--confirm')) {
  await client.query('begin');
  try {
    if (matches.inventory.length) await client.query('delete from public.inventory_movements where owner_id=$1 and item_id = any($2::bigint[])', [ownerId, matches.inventory]);
    if (matches.crops.length) await client.query('delete from public.farm_activities where owner_id=$1 and crop_id = any($2::bigint[])', [ownerId, matches.crops]);
    for (const [table, ids] of Object.entries(matches)) {
      const tableName = table === 'inventory' ? 'inventory_items' : table;
      if (ids.length) await client.query(`delete from public.${tableName} where owner_id=$1 and id = any($2::bigint[])`, [ownerId, ids]);
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

await client.end();
