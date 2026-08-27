export const mediumCapabilities = {
  supports_image: true,
  supports_video: false,
  supports_article: true,
  supports_link: true,
  supports_hashtag: true,
  supports_tags: true,
  publish_enabled: true,
  upload_enabled: false,
  max_title_length: 100,
  max_tags: 5,
  supported_content_formats: ["markdown", "html"],
  supported_publish_statuses: ["public", "draft", "unlisted"],
} as const;

export const mediumPermissions = [
  "basicProfile",
  "publishPost",
] as const;
