import { db } from "./db";
import {
  emojis, emojiPages,
  type Emoji, type InsertEmoji,
  type EmojiPage, type InsertEmojiPage
} from "@shared/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getEmojis(search?: string, category?: string): Promise<Emoji[]>;
  getEmojiBySlug(slug: string): Promise<Emoji | undefined>;
  getEmojiById(id: number): Promise<Emoji | undefined>;
  createEmoji(emoji: InsertEmoji): Promise<Emoji>;
  createEmojis(emojis: InsertEmoji[]): Promise<Emoji[]>;
  incrementCopyCount(id: number): Promise<number>;
  getCategories(): Promise<string[]>;
  getTrending(limit?: number): Promise<Emoji[]>;
  getEmojiCount(): Promise<number>;

  getPages(): Promise<EmojiPage[]>;
  getPageBySlug(slug: string): Promise<EmojiPage | undefined>;
  createPage(page: InsertEmojiPage): Promise<EmojiPage>;
  updatePage(id: number, updates: Partial<InsertEmojiPage>): Promise<EmojiPage | undefined>;
  getUngeneratedPages(limit?: number): Promise<EmojiPage[]>;
}

export class DatabaseStorage implements IStorage {
  async getEmojis(search?: string, category?: string): Promise<Emoji[]> {
    let query = db.select().from(emojis);
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(emojis.name, `%${search}%`),
          ilike(emojis.category, `%${search}%`),
          sql`${emojis.keywords}::text ILIKE ${`%${search}%`}`
        )
      );
    }
    if (category) {
      conditions.push(eq(emojis.category, category));
    }
    if (conditions.length > 0) {
      return await (query as any).where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`);
    }
    return await query;
  }

  async getEmojiBySlug(slug: string): Promise<Emoji | undefined> {
    const [emoji] = await db.select().from(emojis).where(eq(emojis.slug, slug));
    return emoji;
  }

  async getEmojiById(id: number): Promise<Emoji | undefined> {
    const [emoji] = await db.select().from(emojis).where(eq(emojis.id, id));
    return emoji;
  }

  async createEmoji(emoji: InsertEmoji): Promise<Emoji> {
    const [result] = await db.insert(emojis).values(emoji).returning();
    return result;
  }

  async createEmojis(emojiList: InsertEmoji[]): Promise<Emoji[]> {
    if (emojiList.length === 0) return [];
    const results = await db.insert(emojis).values(emojiList).returning();
    return results;
  }

  async incrementCopyCount(id: number): Promise<number> {
    const [result] = await db
      .update(emojis)
      .set({ copyCount: sql`${emojis.copyCount} + 1` })
      .where(eq(emojis.id, id))
      .returning();
    return result?.copyCount ?? 0;
  }

  async getCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: emojis.category })
      .from(emojis)
      .orderBy(emojis.category);
    return results.map(r => r.category);
  }

  async getTrending(limit = 50): Promise<Emoji[]> {
    return await db
      .select()
      .from(emojis)
      .orderBy(desc(emojis.copyCount))
      .limit(limit);
  }

  async getEmojiCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(emojis);
    return Number(result.count);
  }

  async getPages(): Promise<EmojiPage[]> {
    return await db.select().from(emojiPages).orderBy(desc(emojiPages.createdAt));
  }

  async getPageBySlug(slug: string): Promise<EmojiPage | undefined> {
    const [page] = await db.select().from(emojiPages).where(eq(emojiPages.slug, slug));
    return page;
  }

  async createPage(page: InsertEmojiPage): Promise<EmojiPage> {
    const [result] = await db.insert(emojiPages).values(page).returning();
    return result;
  }

  async updatePage(id: number, updates: Partial<InsertEmojiPage>): Promise<EmojiPage | undefined> {
    const [result] = await db.update(emojiPages).set(updates).where(eq(emojiPages.id, id)).returning();
    return result;
  }

  async getUngeneratedPages(limit = 10): Promise<EmojiPage[]> {
    return await db
      .select()
      .from(emojiPages)
      .where(eq(emojiPages.isGenerated, false))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
