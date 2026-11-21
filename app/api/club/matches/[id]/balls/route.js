import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";export const dynamic="force-dynamic";
const scorers=["SUPER_ADMIN","ADMIN","SCORER"];
const extras=["WIDE","NO_BALL","BYE","LEG_BYE","PENALTY"];
const dismissals=["BOWLED","CAUGHT","CAUGHT_BEHIND","CAUGHT_AND_BOWLED","LBW","STUMPED","RUN_OUT","HIT_WICKET","RETIRED_OUT"];
export async function POST(request,{params}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 if(!scorers.includes(user.role))return NextResponse.json({error:"Only assigned scorers can record deliveries."},{status:403});
 try{
 const {id:matchId}=await params,b=await request.json(),innings=Number(b.innings||1),runsBat=Number(b.runsBat||0),extrasType=b.extrasType||null,extrasRuns=Number(b.extrasRuns||0),wicket=!!b.wicket;
 if(!String(b.batter||"").trim()||!String(b.nonStriker||"").trim()||!String(b.bowler||"").trim()||![1,2].includes(innings)||!Number.isInteger(runsBat)||runsBat<0||runsBat>6||!Number.isInteger(extrasRuns)||extrasRuns<0||extrasRuns>7|| (extrasType&&!extras.includes(extrasType)))return NextResponse.json({error:"Invalid delivery details."},{status:400});
 if(wicket&&!dismissals.includes(b.dismissalType))return NextResponse.json({error:"Choose a valid dismissal type."},{status:400});
 const match=await prisma.match.findUnique({where:{id:matchId}});if(!match)return NextResponse.json({error:"Match not found."},{status:404});
 if(["COMPLETED","ABANDONED"].includes(match.status))return NextResponse.json({error:"This match is closed."},{status:409});
 const legalBall=!["WIDE","NO_BALL"].includes(extrasType);
 const result=await prisma.$transaction(async tx=>{
  const prior=await tx.matchBall.findMany({where:{matchId,innings},select:{sequence:true,legalBall:true},orderBy:{sequence:"desc"},take:1});
  const sequence=(prior[0]?.sequence||0)+1;
  const legalCount=await tx.matchBall.count({where:{matchId,innings,legalBall:true}});
  const ball=await tx.matchBall.create({data:{matchId,innings,sequence,overNumber:Math.floor(legalCount/6)+1,ballInOver:legalCount%6+1,batter:String(b.batter||"").trim().slice(0,80),nonStriker:String(b.nonStriker||"").trim().slice(0,80),bowler:String(b.bowler||"").trim().slice(0,80),runsBat,extrasType,extrasRuns,wicket,dismissalType:wicket?b.dismissalType:null,dismissedBatter:wicket?String(b.dismissedBatter||b.batter||"").slice(0,80):null,fielder:String(b.fielder||"").slice(0,80)||null,legalBall,note:String(b.note||"").slice(0,200)||null,createdById:user.id}});
  await tx.match.update({where:{id:matchId},data:{status:"LIVE"}});
  return ball;
 });
 await prisma.auditLog.create({data:{userId:user.id,action:"BALL_RECORDED",module:"ROYAL_SCORING",recordId:result.id,metadata:JSON.stringify({matchId,innings,sequence:result.sequence})}});
 return NextResponse.json({ok:true,ball:result},{status:201});
 }catch(e){console.error("Record ball:",e?.code||e?.message);return NextResponse.json({error:"Unable to record this delivery."},{status:500})}
}
export async function DELETE(request,{params}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 if(!scorers.includes(user.role))return NextResponse.json({error:"Only assigned scorers can undo a delivery."},{status:403});
 try{const {id:matchId}=await params;const url=new URL(request.url),innings=Number(url.searchParams.get("innings")||1);
 const last=await prisma.matchBall.findFirst({where:{matchId,innings},orderBy:{sequence:"desc"}});
 if(!last)return NextResponse.json({error:"No delivery to undo."},{status:404});
 await prisma.matchBall.delete({where:{id:last.id}});
 await prisma.auditLog.create({data:{userId:user.id,action:"BALL_UNDONE",module:"ROYAL_SCORING",recordId:last.id,metadata:JSON.stringify({matchId,innings,sequence:last.sequence})}});
 return NextResponse.json({ok:true,undone:last});
 }catch(e){console.error("Undo ball:",e?.code||e?.message);return NextResponse.json({error:"Unable to undo delivery."},{status:500})}
}
