import {neon} from "@neondatabase/serverless";

type QueryClient={query:(text:string,params?:unknown[])=>Promise<Record<string,unknown>[]>};
const client=()=>{const url=process.env.DATABASE_URL??process.env.POSTGRES_URL;if(!url)throw new Error("Vercel database is not configured");return neon(url) as unknown as QueryClient};

function postgres(sql:string){
 let q=sql.trim().replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi,"SERIAL PRIMARY KEY")
  .replace(/datetime\('now','\+12 hours'\)/gi,"(CURRENT_TIMESTAMP + INTERVAL '12 hours')")
  .replace(/datetime\('now','\+14 days'\)/gi,"(CURRENT_TIMESTAMP + INTERVAL '14 days')")
  .replace(/completed_at TEXT NOT NULL DEFAULT ''/gi,"completed_at TIMESTAMPTZ NULL")
  .replace(/expires_at TEXT NOT NULL/gi,"expires_at TIMESTAMPTZ NOT NULL")
  .replace(/created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP/gi,"created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP")
  .replace(/updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP/gi,"updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP")
  .replace(/COALESCE\(([^,]*completed_at),''\)/gi,"COALESCE($1::text,'')")
  .replace(/CURRENT_TIMESTAMP ELSE '' END/gi,"CURRENT_TIMESTAMP ELSE NULL END")
  .replace(/AS ([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)/g,'AS "$1"');
 const ignore=/^INSERT OR IGNORE/i.test(q);if(ignore)q=q.replace(/^INSERT OR IGNORE/i,"INSERT");
 let n=0;q=q.replace(/\?/g,()=>`$${++n}`);
 if(ignore)q+=q.endsWith(";")?" ON CONFLICT DO NOTHING":" ON CONFLICT DO NOTHING";
 return q.replace(/; ON CONFLICT/g," ON CONFLICT");
}

class Statement{
 constructor(public source:string,public values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.source,values)}
 async all<T>(){const rows=await client().query(postgres(this.source),this.values);return{results:rows as T[]}}
 async run(){let q=postgres(this.source);if(/^INSERT\s/i.test(q)&&!(/\bRETURNING\b/i.test(q)))q+=" RETURNING id";const rows=await client().query(q,this.values);return{success:true,meta:{last_row_id:Number(rows?.[0]?.id??0)}}}
}

export type VercelDatabase={prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown[]>};
export function database():VercelDatabase{return{prepare:(sql)=>new Statement(sql),batch:async(statements)=>{const out=[];for(const statement of statements)out.push(await statement.run());return out}}}
