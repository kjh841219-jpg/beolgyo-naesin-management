import {del,list,put} from "@vercel/blob";

type PutOptions={httpMetadata?:{contentType?:string}};
async function locate(key:string){const found=await list({prefix:key,limit:10});return found.blobs.find(x=>x.pathname===key)??null}
export const env={UPLOADS:{
 async put(key:string,value:ArrayBuffer,options?:PutOptions){return put(key,new Blob([value],{type:options?.httpMetadata?.contentType}),{access:"public",addRandomSuffix:false})},
 async get(key:string){const item=await locate(key);if(!item)return null;const response=await fetch(item.url);if(!response.ok)return null;return{body:response.body as BodyInit}},
 async delete(key:string){const item=await locate(key);if(item)await del(item.url)}
}};
