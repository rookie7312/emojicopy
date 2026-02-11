import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { EMOJI_DATA, TOP_KEYWORDS, generateSeoPages } from "./seed-emojis";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Emojis ===
  app.get("/api/emojis/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/emojis/trending", async (_req, res) => {
    const trending = await storage.getTrending(50);
    res.json(trending);
  });

  app.get("/api/emojis", async (req, res) => {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const emojis = await storage.getEmojis(search, category);
    res.json(emojis);
  });

  app.get("/api/emojis/:slug", async (req, res) => {
    const emoji = await storage.getEmojiBySlug(req.params.slug);
    if (!emoji) return res.status(404).json({ message: "Emoji not found" });
    res.json(emoji);
  });

  app.post("/api/emojis/:id/copy", async (req, res) => {
    const id = Number(req.params.id);
    const copyCount = await storage.incrementCopyCount(id);
    res.json({ copyCount });
  });

  // === SEO Pages ===
  app.get("/api/pages", async (_req, res) => {
    const pages = await storage.getPages();
    res.json(pages);
  });

  app.get("/api/pages/:slug", async (req, res) => {
    const page = await storage.getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.patch("/api/pages/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { title, metaDescription, content } = req.body;
    try {
      const updated = await storage.updatePage(id, { title, metaDescription, content });
      if (!updated) return res.status(404).json({ message: "Page not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.post("/api/pages/generate", async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ message: "Keyword is required" });

    try {
      const existingPage = await storage.getPageBySlug(
        keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      );

      if (existingPage && existingPage.isGenerated) {
        return res.json(existingPage);
      }

      const allEmojis = await storage.getEmojis(keyword.replace(' emoji', ''));
      const relatedEmojiChars = allEmojis.slice(0, 20).map(e => e.emoji);

      const content = generateSeoContent(keyword, allEmojis);

      if (existingPage) {
        const updated = await storage.updatePage(existingPage.id, {
          content,
          relatedEmojis: relatedEmojiChars,
          isGenerated: true,
        });
        return res.json(updated);
      }

      const page = await storage.createPage({
        slug: keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title: `${keyword.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Copy & Paste`,
        keyword,
        metaDescription: `Copy and paste ${keyword} instantly! Find the best ${keyword} for messages, social media, and more.`,
        content,
        relatedEmojis: relatedEmojiChars,
        isGenerated: true,
      });

      res.status(201).json(page);
    } catch (error) {
      console.error("Error generating page:", error);
      res.status(500).json({ message: "Failed to generate page" });
    }
  });

  app.post("/api/pages/generate-batch", async (_req, res) => {
    try {
      const ungenerated = await storage.getUngeneratedPages(5);
      let generated = 0;

      for (const page of ungenerated) {
        const allEmojis = await storage.getEmojis(page.keyword.replace(' emoji', ''));
        const relatedEmojiChars = allEmojis.slice(0, 20).map(e => e.emoji);
        const content = generateSeoContent(page.keyword, allEmojis);

        await storage.updatePage(page.id, {
          content,
          relatedEmojis: relatedEmojiChars,
          isGenerated: true,
        });
        generated++;
      }

      res.json({ generated });
    } catch (error) {
      console.error("Error batch generating:", error);
      res.status(500).json({ message: "Failed to batch generate" });
    }
  });

  // Seed data on startup
  await seedDatabase();

  return httpServer;
}

function generateSeoContent(keyword: string, relatedEmojis: any[]): string {
  const title = keyword.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const emojiSamples = relatedEmojis.slice(0, 10).map(e => `${e.emoji} ${e.name}`).join(', ');
  const cleanKeyword = keyword.replace(' emoji', '');

  return `# ${title} - Copy & Paste

Looking for the perfect **${keyword}** to use in your messages? You've come to the right place! Simply click any emoji below to copy it to your clipboard instantly.

## Popular ${title}s

${relatedEmojis.slice(0, 10).map(e => `- ${e.emoji} **${e.name}** - ${e.description || 'A popular emoji for expressing ' + cleanKeyword}`).join('\n')}

## How to Use ${title}

Using ${keyword}s is easy! Just click on any emoji above and it will be copied to your clipboard. Then paste it anywhere - in text messages, social media posts, emails, or documents.

### How to Use ${title} on iPhone

1. Visit this page on your iPhone's Safari or Chrome browser
2. Tap the ${keyword} you want to copy
3. The emoji is now copied to your clipboard
4. Open any app like iMessage, WhatsApp, Instagram, or Notes
5. Tap and hold the text field and select **Paste**
6. You can also access emojis through your iPhone keyboard by tapping the smiley face icon

### How to Use ${title} on Android

1. Open this page in Chrome or any browser on your Android phone
2. Tap the ${keyword} you want to use
3. It will be copied to your clipboard automatically
4. Switch to any app like Messages, WhatsApp, Telegram, or Facebook
5. Long press in the text field and tap **Paste**
6. Android users can also find emojis by tapping the emoji icon on the Gboard keyboard

### How to Use ${title} on PC (Windows & Mac)

1. Open this page on your computer browser (Chrome, Firefox, Edge, or Safari)
2. Click on the ${keyword} you want to copy
3. The emoji is instantly copied to your clipboard
4. Open any app or website where you want to paste it
5. Press **Ctrl+V** (Windows) or **Cmd+V** (Mac) to paste
6. On Windows, you can also press **Win + .** (period) to open the emoji picker. On Mac, press **Ctrl + Cmd + Space**

## About ${title}

The ${keyword} is one of the most popular emojis used in digital communication. It helps convey emotions and add personality to text-based conversations. ${relatedEmojis.length > 0 ? `Related emojis include ${emojiSamples}.` : ''}

## Frequently Asked Questions

### How do I copy the ${keyword}?
Simply click on the emoji and it will be automatically copied to your clipboard. Then use Ctrl+V (or Cmd+V on Mac) to paste it anywhere.

### Can I use the ${keyword} on any device?
Yes! Emojis are universal and work on all modern devices including iPhone, Android, Windows, and Mac computers.

### What does the ${keyword} mean?
The ${keyword} is commonly used to express feelings related to ${cleanKeyword}. Its meaning can vary slightly depending on context and culture.

### Do ${keyword}s look the same on iPhone and Android?
${title}s may look slightly different on iPhone (Apple) vs Android (Google) devices. Each platform has its own emoji design style, but the meaning stays the same.

### Can I use ${keyword}s in emails?
Yes! You can paste ${keyword}s into any email client including Gmail, Outlook, Yahoo Mail, and Apple Mail. They work in both the subject line and the body of the email.`;
}

async function seedDatabase() {
  const count = await storage.getEmojiCount();
  if (count > 0) {
    console.log(`Database already has ${count} emojis, skipping seed.`);
    return;
  }

  console.log("Seeding emoji database...");

  // Insert emojis in batches
  const batchSize = 50;
  for (let i = 0; i < EMOJI_DATA.length; i += batchSize) {
    const batch = EMOJI_DATA.slice(i, i + batchSize);
    await storage.createEmojis(batch);
  }

  console.log(`Seeded ${EMOJI_DATA.length} emojis.`);

  // Create SEO pages (not yet generated)
  const seoPages = generateSeoPages(TOP_KEYWORDS);
  for (const page of seoPages) {
    try {
      await storage.createPage(page);
    } catch (e) {
      // Ignore duplicates
    }
  }

  console.log(`Created ${seoPages.length} SEO page stubs.`);
}
