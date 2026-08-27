import { z } from "zod";

export const contentItemSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  caption: z.string().trim().max(2200).optional(),
  keywords: z.array(z.string().trim().min(1)).max(50).default([]),
  hashtags: z.array(z.string().trim().min(1)).max(50).default([]),
  cta: z.string().trim().max(240).optional(),
  destinationUrl: z.url().optional(),
  altText: z.string().trim().max(500).optional(),
});

export type ContentItemInput = z.infer<typeof contentItemSchema>;
