export type ManualAssistStatus = "PREPARED" | "OPENED" | "USER_CONFIRMED";

export interface PreparedManualContent {
  image: string;
  title: string;
  description: string;
  caption: string;
  keywords: string[];
  hashtags: string[];
  cta: string;
  destinationUrl: string;
}

export interface ManualAssistTarget {
  id: string;
  platformSlug: string;
  platformName: string;
  uploadUrl: string;
  status: ManualAssistStatus;
  preparedContent: PreparedManualContent;
  confirmedUrl?: string;
  updatedAt: string;
}

export const platformUploadUrls: Record<string, string> = {
  imgur: "https://imgur.com/upload",
  behance: "https://www.behance.net/gallery/create",
  deviantart: "https://www.deviantart.com/submit/",
  tumblr: "https://www.tumblr.com/new",
  flickr: "https://www.flickr.com/photos/upload/",
  blogger: "https://draft.blogger.com/blogger.g",
  medium: "https://medium.com/new-story",
  pinterest: "https://www.pinterest.com/pin-creation-tool/",
  instagram: "https://www.instagram.com/",
  "x-twitter": "https://x.com/compose/post",
  linkedin: "https://www.linkedin.com/feed/",
  reddit: "https://www.reddit.com/submit",
  imgbox: "https://imgbox.com/",
  postimages: "https://postimages.org/",
};
