import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs"; export const dynamic="force-dynamic";
const scorers=["SUPER_ADMIN","ADMIN","SCORER"];
export async function GET(request,{params}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 try{const {id}=await params;const match=await prisma.match.findUnique({where:{id},include:{tournament:{select:{name:true}},squad:{orderBy:[{teamName:"asc"},{battingOrder:"asc"}]},balls:{orderBy:[{innings:"asc"},{sequence:"asc"}]}}});
 if(!match)return NextResponse.json({error:"Match not found."},{status:404});
 return NextResponse.json({match,canScore:scorers.includes(user.role)});
 }catch(e){console.error("Match detail:",e?.code||e?.message);return NextResponse.json({error:"Unable to load match."},{status:500})}
}
export async function PATCH(request,{params}){
 const user=await getSessionUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});
 if(!scorers.includes(user.role))return NextResponse.json({error:"Scorer permission required."},{status:403});
 try{const {id}=await params,b=await request.json(),current=await prisma.match.findUnique({where:{id}});if(!current)return NextResponse.json({error:"Match not found."},{status:404});const data={};
 if(b.tossWinner!==undefined&&b.tossWinner&&! [current.teamA,current.teamB].includes(b.tossWinner))return NextResponse.json({error:"Toss winner must be one of the two teams."},{status:400});
 if(b.tossDecision!==undefined&&b.tossDecision&&!["BAT","BOWL"].includes(b.tossDecision))return NextResponse.json({error:"Toss decision must be bat or bowl."},{status:400});
 if(b.winner!==undefined&&b.winner&&! [current.teamA,current.teamB,"TIE"].includes(b.winner))return NextResponse.json({error:"Winner must be one of the two teams or a tie."},{status:400});
 for(const key of ["tossWinner","tossDecision","result","winner","playerOfMatch"])if(b[key]!==undefined)data[key]=String(b[key]).slice(0,160)||null;
 if(b.status!==undefined){if(!["SCHEDULED","LIVE","COMPLETED","ABANDONED"].includes(b.status))return NextResponse.json({error:"Invalid match status."},{status:400});data.status=b.status}
 const tossWinner=b.tossWinner!==undefined?String(b.tossWinner):current.tossWinner;
 const tossDecision=b.tossDecision!==undefined?String(b.tossDecision):current.tossDecision;
 if(tossWinner&&[current.teamA,current.teamB].includes(tossWinner)&&["BAT","BOWL"].includes(tossDecision)){const other=tossWinner===current.teamA?current.teamB:current.teamA;data.battingFirst=tossDecision==="BAT"?tossWinner:other}
 const match=await prisma.match.update({where:{id},data});
 await prisma.auditLog.create({data:{userId:user.id,action:"MATCH_UPDATED",module:"ROYAL_CRICKET",recordId:id,metadata:JSON.stringify(data)}});
 return NextResponse.json({ok:true,match});
 }catch(e){console.error("Match update:",e?.code||e?.message);return NextResponse.json({error:"Unable to update match."},{status:500})}
}
