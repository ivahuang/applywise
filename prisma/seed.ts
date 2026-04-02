import { PrismaClient } from "@prisma/client";
import schoolsData from "./data/seed-us-universities.json";
import programsData from "./data/seed-programs.json";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding schools...");

  // Seed schools
  for (const s of schoolsData.schools) {
    await prisma.school.upsert({
      where: { name: s.name },
      update: {
        ranking: s.rank,
        website: s.url,
      },
      create: {
        name: s.name,
        nameZh: s.zh,
        shortName: s.short,
        city: s.city,
        state: s.state,
        region: s.region,
        ranking: s.rank,
        website: s.url,
        latitude: s.lat,
        longitude: s.lng,
        verifiedAt: new Date(),
      },
    });
  }

  console.log(`  ✓ ${schoolsData.schools.length} schools seeded`);
  console.log("🌱 Seeding programs...");

  let programCount = 0;
  for (const p of programsData.programs) {
    const school = await prisma.school.findFirst({
      where: { name: p.school },
    });

    if (!school) {
      console.warn(`  ⚠ School not found: ${p.school}`);
      continue;
    }

    await prisma.program.upsert({
      where: {
        schoolId_name: {
          schoolId: school.id,
          name: p.program,
        },
      },
      update: {
        deadline: p.deadline ? new Date(p.deadline) : null,
        essayPrompts: p.essays,
        applicationFee: p.application_fee,
      },
      create: {
        schoolId: school.id,
        name: p.program,
        nameZh: p.program_zh,
        degree: p.degree,
        department: p.department,
        field: p.field,
        duration: p.duration,
        toeflMin: p.toefl_min,
        greRequired: p.gre_required,
        recsRequired: p.recs_required,
        applicationFee: p.application_fee,
        wesRequired: p.wes_required,
        interviewReq: p.interview_required,
        deadline: p.deadline ? new Date(p.deadline) : null,
        essayPrompts: p.essays,
        portalUrl: p.portal_url,
        programUrl: p.program_url,
        notes: p.notes || null,
        verifiedAt: p.verified_at ? new Date(p.verified_at) : null,
      },
    });
    programCount++;
  }

  console.log(`  ✓ ${programCount} programs seeded`);
  console.log("✅ Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
