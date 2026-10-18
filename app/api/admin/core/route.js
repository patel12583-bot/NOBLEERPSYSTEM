import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = {
  departments: { model: "department", fields: ["code","name","hodId","description","status"] },
  programs: { model: "program", fields: ["code","name","durationYears","totalSemesters","fees","description","status","departmentId"] },
  academicYears: { model: "academicYear", fields: ["name","startDate","endDate","active"] },
  semesters: { model: "semester", fields: ["number","name","academicYearId"] },
  divisions: { model: "division", fields: ["name","capacity","programId","semesterId"] },
  rooms: { model: "room", fields: ["code","name","capacity","type"] },
  subjects: { model: "subject", fields: ["code","name","credits","departmentId","programId","semesterId","status","facultyId"] },
  books: { model: "book", fields: ["isbn","title","author","category","quantity","available"] },
  notices: { model: "notice", fields: ["title","content","audience","published"] }
};

async function guard() {
  const user = await getSessionUser();
  if (!user || !["SUPER_ADMIN","ADMIN","HOD"].includes(user.role)) return null;
  return user;
}

function clean(data, fields) {
  const out = {};
  for (const key of fields) if (data[key] !== undefined) out[key] = data[key];
  if (out.durationYears !== undefined) out.durationYears = Number(out.durationYears);
  if (out.totalSemesters !== undefined) out.totalSemesters = Number(out.totalSemesters);
  if (out.fees !== undefined) out.fees = out.fees === "" || out.fees === null ? null : Number(out.fees);
  if (out.departmentId === "") out.departmentId = undefined;
  if (out.description === "") out.description = null;
  if (out.status !== undefined && !["ACTIVE", "INACTIVE"].includes(out.status)) throw new Error("Status must be ACTIVE or INACTIVE.");
  if (out.number !== undefined) out.number = Number(out.number);
  if (out.capacity !== undefined) out.capacity = out.capacity === "" ? null : Number(out.capacity);
  if (out.credits !== undefined) out.credits = out.credits === "" ? null : Number(out.credits);
  if (out.quantity !== undefined) out.quantity = Number(out.quantity);
  if (out.available !== undefined) out.available = Number(out.available);
  if (out.active !== undefined) out.active = Boolean(out.active);
  if (out.published !== undefined) out.published = Boolean(out.published);
  if (out.hodId === "") out.hodId = null;
  if (out.description === "") out.description = null;
  if (out.status !== undefined && !["ACTIVE", "INACTIVE"].includes(out.status)) throw new Error("Department status must be ACTIVE or INACTIVE.");
  if (out.startDate) out.startDate = new Date(out.startDate);
  if (out.endDate) out.endDate = new Date(out.endDate);
  return out;
}

export async function GET(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const key = new URL(request.url).searchParams.get("module");
  const cfg = allowed[key];
  if (!cfg) return NextResponse.json({error:"Invalid module"},{status:400});
  const rows = await prisma[cfg.model].findMany({ orderBy: { createdAt: "desc" }, ...(key === "departments" ? { include: { hod: { select: { id: true, name: true, facultyId: true } } } } : key === "programs" ? { include: { department: { select: { id: true, name: true, code: true } } } } : key === "subjects" ? { include: { department: { select: { id: true, name: true, code: true } }, program: { select: { id: true, name: true, code: true, totalSemesters: true } }, semester: { select: { id: true, name: true, number: true } }, facultySubjects: { include: { faculty: { select: { id: true, name: true, facultyId: true } } } } } } : {}) });
  const faculty = ["departments","subjects"].includes(key) ? await prisma.faculty.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, facultyId: true, departmentId: true }, orderBy: { name: "asc" } }) : [];
  const departments = ["programs","subjects"].includes(key) ? await prisma.department.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }) : [];
  const programs = key === "subjects" ? await prisma.program.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, code: true, departmentId: true, totalSemesters: true }, orderBy: { name: "asc" } }) : [];
  const semesters = key === "subjects" ? await prisma.semester.findMany({ select: { id: true, name: true, number: true }, orderBy: { number: "asc" } }) : [];
  return NextResponse.json({ rows, faculty, departments, programs, semesters });
}

export async function POST(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();

  if (body.action === "seedDefaultAcademic") {
    try {
      const departments = [
        ["BCA", "Bachelor of Computer Applications"],
        ["BRS", "Bachelor of Rural Studies"],
        ["BSW", "Bachelor of Social Work"],
        ["MSW", "Master of Social Work"],
        ["DIPLOMA", "Diploma Engineering"]
      ];
      const programs = [
        ["BCA", "BCA", "Bachelor of Computer Applications", 3, "BCA"],
        ["BRS", "BRS", "Bachelor of Rural Studies", 3, "BRS"],
        ["BSW", "BSW", "Bachelor of Social Work", 3, "BSW"],
        ["MSW", "MSW", "Master of Social Work", 2, "MSW"],
        ["DIP-MECH", "Diploma Mechanical Engineering", "Diploma Mechanical Engineering", 3, "DIPLOMA"],
        ["DIP-COMP", "Diploma Computer Engineering", "Diploma Computer Engineering", 3, "DIPLOMA"],
        ["DIP-IT", "Diploma IT Engineering", "Diploma IT Engineering", 3, "DIPLOMA"],
        ["DIP-CIVIL", "Diploma Civil Engineering", "Diploma Civil Engineering", 3, "DIPLOMA"]
      ];

      const result = await prisma.$transaction(async tx => {
        const depMap = {};
        for (const [code,name] of departments) {
          const row = await tx.department.upsert({where:{code},update:{name},create:{code,name}});
          depMap[code]=row;
        }
        const createdPrograms=[];
        for (const [code,name,displayName,duration,depCode] of programs) {
          const row = await tx.program.upsert({
            where:{code},
            update:{name:displayName,durationYears:duration,departmentId:depMap[depCode].id},
            create:{code,name:displayName,durationYears:duration,departmentId:depMap[depCode].id}
          });
          createdPrograms.push(row);
        }
        const academicYears=[];
        for(let y=2023;y<=2030;y++){
          const name=`${y}-${String(y+1).slice(-2)}`;
          const startDate=new Date(`${y}-07-01T00:00:00.000Z`);
          const endDate=new Date(`${y+1}-06-30T23:59:59.999Z`);
          const row=await tx.academicYear.upsert({where:{name},update:{startDate,endDate,active:name==="2026-27"},create:{name,startDate,endDate,active:name==="2026-27"}});
          academicYears.push(row);
        }
        const activeYear=academicYears.find(x=>x.name==="2026-27")||academicYears[0];
        const semesters=[];
        for(let number=1;number<=6;number++){
          const row=await tx.semester.upsert({where:{number_academicYearId:{number,academicYearId:activeYear.id}},update:{name:"Semester "+number},create:{number,name:"Semester "+number,academicYearId:activeYear.id}});
          semesters.push(row);
        }
        const divisions=[];
        for(const program of createdPrograms){
          for(const semester of semesters){
            for(const name of ["A","B","C"]){
              const row=await tx.division.upsert({where:{name_programId_semesterId:{name,programId:program.id,semesterId:semester.id}},update:{capacity:60},create:{name,capacity:60,programId:program.id,semesterId:semester.id}});
              divisions.push(row);
            }
          }
        }
        return {departments:Object.keys(depMap).length,programs:createdPrograms.length,academicYears:academicYears.length,semesters:semesters.length,divisions:divisions.length};
      });
      return NextResponse.json({ok:true,message:"Default programs and semesters are ready.",...result});
    } catch(e) {
      console.error("Academic seed error:",e);
      return NextResponse.json({error:"Unable to prepare default academic structure."},{status:400});
    }
  }

  const cfg = allowed[body.module];
  if (!cfg) return NextResponse.json({error:"Invalid module"},{status:400});
  try {
    const data = clean(body.data || {}, cfg.fields);
    if (body.module === "subjects") {
      const facultyId = data.facultyId;
      delete data.facultyId;
      const row = await prisma.subject.create({ data: { ...data, ...(facultyId ? { facultySubjects: { create: { facultyId } } } : {}) } });
      return NextResponse.json({ row }, {status:201});
    }
    const row = await prisma[cfg.model].create({ data });
    return NextResponse.json({ row }, {status:201});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Unable to save. Check required fields or duplicate values."},{status:400});
  }
}

export async function PUT(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();
  const cfg = allowed[body.module];
  if (!cfg || !body.id) return NextResponse.json({error:"Invalid request"},{status:400});
  try {
    const data = clean(body.data||{},cfg.fields);
    if (body.module === "subjects") {
      const facultyId = data.facultyId;
      delete data.facultyId;
      const row = await prisma.$transaction(async tx => {
        await tx.facultySubject.deleteMany({ where: { subjectId: body.id } });
        return tx.subject.update({ where: { id: body.id }, data: { ...data, ...(facultyId ? { facultySubjects: { create: { facultyId } } } : {}) } });
      });
      return NextResponse.json({row});
    }
    const row = await prisma[cfg.model].update({where:{id:body.id},data});
    return NextResponse.json({row});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Unable to update record."},{status:400});
  }
}

export async function DELETE(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();
  const cfg = allowed[body.module];
  if (!cfg || !body.id) return NextResponse.json({error:"Invalid request"},{status:400});
  try {
    await prisma[cfg.model].delete({where:{id:body.id}});
    return NextResponse.json({ok:true});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Record cannot be deleted because it is being used by another ERP record."},{status:409});
  }
}
