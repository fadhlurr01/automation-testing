export const imgboxCapabilities = {
  supports_image: true,
  supports_video: false,
  supports_article: false,
  supports_link: false,
  supports_hashtag: false,
  supports_tags: false,
  publish_enabled: true,
  upload_enabled: true,
  max_file_size_bytes: 10 * 1024 * 1024, // 10MB limit
  supported_image_types: ["image/jpeg", "image/png", "image/gif"],
} as const;
