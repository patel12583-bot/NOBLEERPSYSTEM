import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CricketShell from "@/components/CricketShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user || !["ADMIN", "SUPER_ADMIN", "TREASURER", "SCORER", "MEMBER"].includes(user.role)) redirect("/login");
  const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } }).catch(() => null);
  const [members, admins, matchesPlayed, liveMatches, finance] = await Promise.all([
    prisma.memberProfile.count({ where: { approvalStatus: "ACTIVE" } }).catch(() => 0),
    prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" } }).catch(() => 0),
    prisma.match.count({ where: { status: "COMPLETED" } }).catch(() => 0),
    prisma.match.count({ where: { status: "LIVE" } }).catch(() => 0),
    prisma.financeEntry.findMany({ where: { status: "APPROVED" }, select: { type: true, amount: true } }).catch(() => [])
  ]);
  const income = finance.filter(x => x.type !== "EXPENSE").reduce((s,x)=>s+Number(x.amount),0);
  const expenses = finance.filter(x => x.type === "EXPENSE").reduce((s,x)=>s+Number(x.amount),0);
  const balance = new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(income-expenses);
  const name = profile?.name || user.username;
  return <CricketShell user={{ name, role: user.role }}><div className="rcWelcome"><div><div className="rcEyebrow">CLUB OVERVIEW</div><h1>Welcome, {name.split(" ")[0]}.</h1><p>Here’s what’s happening across Royal Cricket Club.</p></div><span className="rcRolePill">{user.role.replaceAll("_", " ")}</span></div><div className="rcMetricGrid"><div className="rcMetric"><small>ACTIVE MEMBERS</small><b>{members}</b><span>Approved club profiles</span></div><div className="rcMetric"><small>CLUB ADMINS</small><b>{admins}</b><span>Authorised administrators</span></div><div className="rcMetric"><small>CLUB BALANCE</small><b>{balance}</b><span>Approved income less expenses</span></div><div className="rcMetric"><small>COMPLETED MATCHES</small><b>{matchesPlayed}</b><span>{liveMatches} live right now</span></div></div><div className="rcDashGrid"><section className="rcCard"><h3>Club workspace</h3><div className="rcQuickLinks"><a href="/club/members">♟ &nbsp; Member directory</a><a href="/club/transactions">₹ &nbsp; Finance ledger</a><a href="/club/matches">🏏 &nbsp; Matches & fixtures</a><a href="/club/scoring">◉ &nbsp; Live scoring</a><a href="/club/tournaments">🏆 &nbsp; Tournaments</a><a href="/club/statistics">↗ &nbsp; Player statistics</a><a href="/club/attendance">✓ &nbsp; Attendance</a><a href="/club/notices">◈ &nbsp; Club notices</a></div></section><section className="rcCard"><h3>Your membership</h3><div className="rcMemberRow"><div><b>{profile?.name || user.username}</b><small>{profile?.memberCode || user.email || "Administrator account"}</small></div><span className="rcRolePill">{user.role}</span></div><p style={{fontSize:12,color:"#77867d",lineHeight:1.7}}>All signed-in members can view the club finance ledger. Only authorised roles can add or change financial records.</p></section></div></CricketShell>;
}
