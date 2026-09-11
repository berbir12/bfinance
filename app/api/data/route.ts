import { env } from 'cloudflare:workers';

const statements = [
  `CREATE TABLE IF NOT EXISTS businesses (id TEXT PRIMARY KEY, name_am TEXT NOT NULL, name_en TEXT NOT NULL, type TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id TEXT NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>0), date TEXT NOT NULL, party TEXT, description TEXT NOT NULL, payment_method TEXT NOT NULL DEFAULT 'cash', notes TEXT, deleted_at TEXT, created_at TEXT NOT NULL, FOREIGN KEY(business_id) REFERENCES businesses(id))`,
  `CREATE TABLE IF NOT EXISTS inventory_items (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, brand TEXT, quantity REAL NOT NULL CHECK(quantity>=0), unit TEXT NOT NULL, purchase_price REAL NOT NULL CHECK(purchase_price>=0), selling_price REAL, minimum_stock REAL NOT NULL DEFAULT 0, supplier TEXT, location TEXT, expiration_date TEXT, deleted_at TEXT, FOREIGN KEY(business_id) REFERENCES businesses(id))`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (id INTEGER PRIMARY KEY AUTOINCREMENT, item_id INTEGER NOT NULL, business_id TEXT NOT NULL, movement_type TEXT NOT NULL, reason TEXT NOT NULL, quantity REAL NOT NULL CHECK(quantity>0), date TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, FOREIGN KEY(item_id) REFERENCES inventory_items(id), FOREIGN KEY(business_id) REFERENCES businesses(id))`,
  `CREATE TABLE IF NOT EXISTS parties (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, location TEXT, total REAL NOT NULL DEFAULT 0, paid REAL NOT NULL DEFAULT 0, due_date TEXT, notes TEXT, deleted_at TEXT, FOREIGN KEY(business_id) REFERENCES businesses(id))`,
  `CREATE TABLE IF NOT EXISTS crops (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id TEXT NOT NULL, name TEXT NOT NULL, field TEXT NOT NULL, planting_date TEXT NOT NULL, harvest_date TEXT NOT NULL, area REAL NOT NULL, expected_yield REAL NOT NULL, actual_yield REAL NOT NULL DEFAULT 0, status TEXT NOT NULL, FOREIGN KEY(business_id) REFERENCES businesses(id))`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_business_date ON transactions(business_id,date)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_business ON inventory_items(business_id)`,
  `CREATE INDEX IF NOT EXISTS idx_parties_business_type ON parties(business_id,type)`,
];

async function setup() {
  for (const sql of statements) await env.DB.prepare(sql).run();
  const count = await env.DB.prepare('SELECT COUNT(*) count FROM businesses').first<{count:number}>();
  if ((count?.count ?? 0) > 0) return;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO businesses VALUES ('farm','እርሻ','Farm','farm'),('beverage','የመጠጥ ንግድ','Beverage Business','beverage')`),
    env.DB.prepare(`INSERT INTO transactions (business_id,type,category,amount,date,party,description,payment_method,created_at) VALUES
      ('beverage','income','sales',126500,'2026-09-09','አበበ ገብረ','የመጠጥ ሽያጭ','bank',datetime('now')),
      ('farm','income','crop-sales',186000,'2026-09-06','ወ/ሮ ሰላም','የበቆሎ ሽያጭ','cash',datetime('now')),
      ('beverage','expense','purchases',118400,'2026-09-07','ሞአ መጠጦች','የመጠጥ ግዢ','bank',datetime('now')),
      ('farm','expense','fertilizer',78500,'2026-09-03','አዲስ አግሮ','ማዳበሪያ ግዢ','cash',datetime('now')),
      ('farm','expense','labor',42900,'2026-09-01','የእርሻ ሰራተኞች','የወር የሰራተኛ ክፍያ','cash',datetime('now')),
      ('beverage','income','sales',173750,'2026-08-25','ብሩክ ሱቅ','የጅምላ ሽያጭ','mobile',datetime('now'))`),
    env.DB.prepare(`INSERT INTO inventory_items (business_id,name,category,brand,quantity,unit,purchase_price,selling_price,minimum_stock,supplier,location,expiration_date) VALUES
      ('beverage','ኮካ ኮላ 500ml','beverage','Coca-Cola',8,'ሳጥን',620,760,15,'ሞአ መጠጦች','መጋዘን A','2027-02-15'),
      ('beverage','አምቦ 500ml','beverage','Ambo',34,'ሳጥን',510,650,12,'አምቦ ውሃ','መጋዘን A','2027-04-20'),
      ('farm','NPS ማዳበሪያ','fertilizer',NULL,12,'ከረጢት',4200,NULL,20,'አዲስ አግሮ','ዋና መጋዘን',NULL),
      ('farm','የበቆሎ ዘር','seeds',NULL,145,'ኪ.ግ',185,NULL,50,'ኢትዮ ዘር','ዘር መጋዘን','2027-01-10')`),
    env.DB.prepare(`INSERT INTO parties (business_id,type,name,phone,location,total,paid,due_date,notes) VALUES
      ('beverage','customer','አበበ ገብረ','0911 234 567','አዲስ አበባ',68000,43000,'2026-09-05','መደበኛ ደንበኛ'),
      ('beverage','customer','ብሩክ ሱቅ','0912 765 432','ዱከም',47500,27500,'2026-09-18',NULL),
      ('farm','supplier','አዲስ አግሮ','011 445 6677','አዲስ አበባ',98000,63000,'2026-09-14','የማዳበሪያ አቅራቢ'),
      ('beverage','supplier','ሞአ መጠጦች','011 661 2233','ሰበታ',142000,106000,'2026-09-20',NULL)`),
    env.DB.prepare(`INSERT INTO crops (business_id,name,field,planting_date,harvest_date,area,expected_yield,actual_yield,status) VALUES ('farm','በቆሎ','ምስራቅ ማሳ','2026-05-18','2026-10-20',3.5,6200,0,'growing'),('farm','ጤፍ','ሰሜን ማሳ','2026-07-02','2026-11-12',2.0,2800,0,'planted')`),
  ]);
}

export async function GET() {
  await setup();
  const [transactions,inventory,parties,crops] = await Promise.all([
    env.DB.prepare(`SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY date DESC,id DESC`).all(),
    env.DB.prepare(`SELECT *, quantity*purchase_price value FROM inventory_items WHERE deleted_at IS NULL ORDER BY business_id,name`).all(),
    env.DB.prepare(`SELECT *, total-paid balance FROM parties WHERE deleted_at IS NULL ORDER BY type,name`).all(),
    env.DB.prepare(`SELECT * FROM crops ORDER BY harvest_date`).all(),
  ]);
  return Response.json({transactions:transactions.results,inventory:inventory.results,parties:parties.results,crops:crops.results});
}

export async function POST(request: Request) {
  await setup();
  try {
    const body = await request.json() as Record<string,string|number>;
    if (body.kind === 'transaction') {
      const amount = Number(body.amount);
      if (!amount || amount <= 0 || !body.description || !['income','expense'].includes(String(body.type))) return Response.json({error:'Invalid transaction'}, {status:400});
      const result = await env.DB.prepare(`INSERT INTO transactions (business_id,type,category,amount,date,party,description,payment_method,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`).bind(body.businessId,body.type,body.category,amount,body.date,body.party||null,body.description,body.paymentMethod,body.notes||null).run();
      return Response.json({ok:true,id:result.meta.last_row_id});
    }
    if (body.kind === 'inventory') {
      const qty=Number(body.quantity), price=Number(body.purchasePrice);
      if (!body.name || qty < 0 || price < 0) return Response.json({error:'Invalid inventory'}, {status:400});
      const result=await env.DB.prepare(`INSERT INTO inventory_items (business_id,name,category,brand,quantity,unit,purchase_price,selling_price,minimum_stock,supplier,location,expiration_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(body.businessId,body.name,body.category,body.brand||null,qty,body.unit,price,Number(body.sellingPrice)||null,Number(body.minimumStock)||0,body.supplier||null,body.location||null,body.expirationDate||null).run();
      return Response.json({ok:true,id:result.meta.last_row_id});
    }
    if (body.kind === 'movement') {
      const id=Number(body.itemId), qty=Number(body.quantity), sign=body.movementType==='in'?1:-1;
      const item=await env.DB.prepare(`SELECT quantity,business_id FROM inventory_items WHERE id=? AND deleted_at IS NULL`).bind(id).first<{quantity:number,business_id:string}>();
      if (!item || qty<=0 || item.quantity+sign*qty<0) return Response.json({error:'Invalid stock movement'}, {status:400});
      await env.DB.batch([env.DB.prepare(`UPDATE inventory_items SET quantity=quantity+? WHERE id=?`).bind(sign*qty,id),env.DB.prepare(`INSERT INTO inventory_movements (item_id,business_id,movement_type,reason,quantity,date,notes,created_at) VALUES (?,?,?,?,?,?,?,datetime('now'))`).bind(id,item.business_id,body.movementType,body.reason,qty,body.date,body.notes||null)]);
      return Response.json({ok:true});
    }
    return Response.json({error:'Unknown operation'},{status:400});
  } catch { return Response.json({error:'Could not save record'},{status:500}); }
}
