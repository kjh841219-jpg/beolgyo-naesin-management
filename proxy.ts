import {NextRequest,NextResponse} from "next/server";

export function proxy(request:NextRequest){
 const host=(request.headers.get("x-forwarded-host")??request.headers.get("host")??"").split(":")[0].toLowerCase();
 if(host==="naesin-vercel-deploy.vercel.app"){
  const url=request.nextUrl.clone();
  url.protocol="https:";
  url.host="vercel-deploy-mauve-one-18.vercel.app";
  return NextResponse.redirect(url,308);
 }
 if(request.nextUrl.pathname!=="/")return NextResponse.next();
 if(host==="beolgyo-naesin-management.vercel.app")return NextResponse.rewrite(new URL("/naesin",request.url));
 if(host==="beolgyo-academy-manual.vercel.app")return NextResponse.rewrite(new URL("/manual",request.url));
 return NextResponse.next();
}

export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
