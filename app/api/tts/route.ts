import {NextRequest} from "next/server";

export const runtime="nodejs";

export async function GET(request:NextRequest){
 const text=(request.nextUrl.searchParams.get("text")||"").replace(/\s+/g," ").trim().slice(0,320);
 if(!text)return Response.json({error:"재생할 영어 문장이 없습니다."},{status:400});
 const url=`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=${encodeURIComponent(text)}`;
 const upstream=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; BeolgyoEnglish/1.0)",Accept:"audio/mpeg"},cache:"force-cache"});
 if(!upstream.ok||!upstream.body)return Response.json({error:"음원을 불러오지 못했습니다."},{status:502});
 return new Response(upstream.body,{headers:{"Content-Type":"audio/mpeg","Cache-Control":"public, max-age=2592000, stale-while-revalidate=86400","Content-Disposition":"inline"}});
}
