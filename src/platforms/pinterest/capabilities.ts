export const pinterestCapabilities = {
  supports_image: true,
  supports_video: true,
  supports_article: false,
  supports_link: true,
  supports_hashtag: true,
  supports_tags: true,
  publish_enabled: true,
  upload_enabled: true,
  max_title_length: 100,
  max_description_length: 500,
  max_link_length: 2048,
  supported_image_types: ["image/jpeg", "image/png", "image/webp"],
  supported_video_types: ["video/mp4", "video/quicktime"],
} as const;

export const pinterestPermissions = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
] as const;
