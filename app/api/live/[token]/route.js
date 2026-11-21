import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request,{params}){
 try{const {token}=await params;const match=await prisma.match.findUnique({where:{shareToken:token},include:{tournament:{select:{name:true}},balls:{orderBy:[{innings:"asc"},{sequence:"asc"}]}}});
 if(!match)return NextResponse.json({error:"Live match not found."},{status:404});
 return NextResponse.json({match});
 }catch(e){console.error("Public live score:",e?.code||e?.message);return NextResponse.json({error:"Live score is temporarily unavailable."},{status:503})}
}
