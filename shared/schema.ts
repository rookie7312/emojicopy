import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export * from "./models/auth";
export * from "./models/chat";

export const emojis = pgTable("emojis", {
  id: serial("id").primaryKey(),
  emoji: text("emoji").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  keywords: text("keywords").array(),
  description: text("description"),
  copyCount: integer("copy_count").default(0),
});

export const emojiPages = pgTable("emoji_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  keyword: text("keyword").notNull(),
  metaDescription: text("meta_description"),
  content: text("content"),
  relatedEmojis: text("related_emojis").array(),
  isGenerated: boolean("is_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmojiSchema = createInsertSchema(emojis).omit({ id: true, copyCount: true });
export const insertEmojiPageSchema = createInsertSchema(emojiPages).omit({ id: true, createdAt: true });

export type Emoji = typeof emojis.$inferSelect;
export type InsertEmoji = z.infer<typeof insertEmojiSchema>;
export type EmojiPage = typeof emojiPages.$inferSelect;
export type InsertEmojiPage = z.infer<typeof insertEmojiPageSchema>;
