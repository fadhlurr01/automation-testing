export const instagramCapabilities = {
  supports_image: true,
  supports_video: true,
  supports_article: false,
  supports_link: false,
  supports_hashtag: true,
  supports_tags: true,
  publish_enabled: true,
  upload_enabled: true,
  max_caption_length: 2200,
  max_hashtags: 30,
  supported_image_types: ["image/jpeg", "image/png"],
  supported_video_types: ["video/mp4", "video/quicktime"],
  aspect_ratios: {
    image: { min: 4 / 5, max: 1.91 / 1 },
    reels: { min: 9 / 16, max: 16 / 9 },
  },
} as const;

export const instagramPermissions = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;
