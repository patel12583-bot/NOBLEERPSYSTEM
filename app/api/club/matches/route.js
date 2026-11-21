import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs"; export const dynamic="force-dynamic";
const managers=["SUPER_ADMIN","ADMIN","SCORER"];
export async function GET(){
 const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 try{const matches=await prisma.match.findMany({orderBy:{scheduledAt:"desc"},take:100,include:{tournament:{select:{name:true}},balls:{select:{innings:true,runsBat:true,extrasRuns:true,wicket:true,legalBall:true}}}});
 return NextResponse.json({matches:matches.map(m=>({...m,innings:[1,2].map(n=>{const b=m.balls.filter(x=>x.innings===n);return {innings:n,runs:b.reduce((s,x)=>s+x.runsBat+x.extrasRuns,0),wickets:b.filter(x=>x.wicket).length,legalBalls:b.filter(x=>x.legalBall).length}})}))});
 }catch(e){console.error("Matches list:",e?.code||e?.message);return NextResponse.json({error:"Match database migration is required."},{status:503})}
}
export async function POST(request){
 const user=await getSessionUser(); if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 if(!managers.includes(user.role))return NextResponse.json({error:"Only Admin or assigned scorers can create matches."},{status:403});
 try{const b=await request.json(),title=String(b.title||"").trim().slice(0,100),teamA=String(b.teamA||"").trim().slice(0,80),teamB=String(b.teamB||"").trim().slice(0,80),format=String(b.format||"T20"),overs=Number(b.overs||20),scheduledAt=new Date(b.scheduledAt||Date.now());
 if(!title||!teamA||!teamB||teamA.toLowerCase()===teamB.toLowerCase()||!Number.isInteger(overs)||overs<1||overs>100||Number.isNaN(scheduledAt.getTime()))return NextResponse.json({error:"Enter a match title, two different teams, date and valid overs."},{status:400});
 const match=await prisma.match.create({data:{title,teamA,teamB,venue:String(b.venue||"").trim().slice(0,120)||null,format,overs,scheduledAt,tournamentId:b.tournamentId||null,createdById:user.id}});
 await prisma.auditLog.create({data:{userId:user.id,action:"MATCH_CREATED",module:"ROYAL_CRICKET",recordId:match.id,metadata:JSON.stringify({teamA,teamB,format,overs})}});
 return NextResponse.json({ok:true,match},{status:201});
 }catch(e){console.error("Create match:",e?.code||e?.message);return NextResponse.json({error:"Unable to create match. Check selected tournament and database migration."},{status:500})}
}
