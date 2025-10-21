/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const sampleSites = [
    {
      title: "Next.js",
      description: "The React framework for the web.",
      url: "https://nextjs.org",
      faviconUrl: "https://nextjs.org/favicon.ico",
      categories: ["Development"],
      tags: ["React", "Next.js", "TypeScript"],
    },
    {
      title: "React",
      description: "A JavaScript library for building user interfaces.",
      url: "https://react.dev",
      faviconUrl: "https://react.dev/favicon.ico",
      categories: ["Development"],
      tags: ["React", "UI"],
    },
    {
      title: "Tailwind CSS",
      description: "A utility-first CSS framework.",
      url: "https://tailwindcss.com",
      faviconUrl: "https://tailwindcss.com/favicons/favicon.ico",
      categories: ["Design", "Development"],
      tags: ["CSS", "Design"],
    },
    {
      title: "MDN Web Docs",
      description: "Resources for developers, by developers.",
      url: "https://developer.mozilla.org",
      faviconUrl: "https://developer.mozilla.org/favicon-48x48.cbbd161b.png",
      categories: ["Development"],
      tags: ["Docs", "JavaScript", "CSS", "HTML"],
    },
    {
      title: "GitHub",
      description: "Where the world builds software.",
      url: "https://github.com",
      faviconUrl: "https://github.githubassets.com/favicons/favicon.png",
      categories: ["Open Source", "Development"],
      tags: ["Git", "Open Source"],
    },
    {
      title: "Vercel",
      description: "Develop. Preview. Ship.",
      url: "https://vercel.com",
      faviconUrl: "https://vercel.com/favicon.ico",
      categories: ["DevOps"],
      tags: ["Hosting", "Next.js"],
    },
    {
      title: "Supabase",
      description: "The open source Firebase alternative.",
      url: "https://supabase.com",
      faviconUrl: "https://supabase.com/favicon.ico",
      categories: ["Development", "Database"],
      tags: ["Postgres", "Auth", "Storage"],
    },
    {
      title: "Prisma",
      description: "Next-generation Node.js and TypeScript ORM.",
      url: "https://www.prisma.io",
      faviconUrl: "https://www.prisma.io/favicon.ico",
      categories: ["Development", "Database"],
      tags: ["ORM", "TypeScript"],
    },
  ];

  const allCategoryNames = Array.from(new Set(sampleSites.flatMap((s) => s.categories))).sort();
  const allTagNames = Array.from(new Set(sampleSites.flatMap((s) => s.tags))).sort();

  const categoryRecords = await Promise.all(
    allCategoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  const tagRecords = await Promise.all(
    allTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const categoriesByName = new Map(categoryRecords.map((c) => [c.name, c.id]));
  const tagsByName = new Map(tagRecords.map((t) => [t.name, t.id]));

  for (const s of sampleSites) {
    await prisma.site.upsert({
      where: { url: s.url },
      update: {
        title: s.title,
        description: s.description,
        faviconUrl: s.faviconUrl || null,
        imageUrl: s.imageUrl || null,
        lastFetchedAt: new Date(),
      },
      create: {
        url: s.url,
        title: s.title,
        description: s.description,
        faviconUrl: s.faviconUrl || null,
        imageUrl: s.imageUrl || null,
        lastFetchedAt: new Date(),
        categories: {
          create: (s.categories || []).map((name) => ({
            category: { connect: { id: categoriesByName.get(name) } },
          })),
        },
        tags: {
          create: (s.tags || []).map((name) => ({
            tag: { connect: { id: tagsByName.get(name) } },
          })),
        },
      },
    });
  }

  console.log(`Seeded ${sampleSites.length} sites, ${allCategoryNames.length} categories, ${allTagNames.length} tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
