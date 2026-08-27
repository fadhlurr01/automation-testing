update public.platforms
set api_enabled = true,
    oauth_enabled = true,
    publish_enabled = true,
    upload_enabled = true,
    supports_image = true,
    supports_video = true,
    supports_article = false,
    supports_link = false,
    supports_hashtag = true,
    supports_tags = true,
    supports_analytics = false,
    status = 'configured'
where slug = 'instagram';
