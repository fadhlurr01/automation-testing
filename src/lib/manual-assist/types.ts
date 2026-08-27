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
  // Social Media
  pinterest: "https://www.pinterest.com/pin-creation-tool/",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  twitter: "https://x.com/compose/post",
  "x-twitter": "https://x.com/compose/post",
  minds: "https://www.minds.com/newsfeed",
  flipboard: "https://flipboard.com/",

  // Blogging & Editorial Publishing
  medium: "https://medium.com/new-story",
  wattpad: "https://www.wattpad.com/myworks/new",
  wix: "https://manage.wix.com/",
  penzu: "https://penzu.com/app",
  weebly: "https://www.weebly.com/app/home",
  livejournal: "https://www.livejournal.com/update.bml",

  // Image & Media Hosting
  imgbb: "https://imgbb.com/upload",
  postimages: "https://postimages.org/",
  publitio: "https://publit.io/dashboard/files",
  prntscr: "https://prnt.sc/",
  "freeimage-host": "https://freeimage.host/",
  imageshack: "https://imageshack.com/upload",
  mediafire: "https://www.mediafire.com/myfiles/",
  "4shared": "https://www.4shared.com/",
  imagebam: "https://www.imagebam.com/upload",
  shutterfly: "https://www.shutterfly.com/upload",
  tinypic: "https://tinypic.host/",
  gifyu: "https://gifyu.com/",
  imgur: "https://imgur.com/upload",
  googlephotos: "https://photos.google.com/upload",

  // Portfolio, Curation & Discovery
  behance: "https://www.behance.net/gallery/create",
  "500px": "https://500px.com/upload",
  dropmark: "https://dropmark.com/app",
  fliphtml5: "https://fliphtml5.com/quick-upload",
  locanto: "https://www.locanto.co.id/post/",
  klook: "https://www.klook.com/",
  glints: "https://glints.com/id/community",
  tripadvisor: "https://www.tripadvisor.co.id/UserReview",

  // Stock Visual Platforms
  pixabay: "https://pixabay.com/accounts/media/upload/",
  unsplash: "https://unsplash.com/submit",
  pexels: "https://www.pexels.com/upload/",
};
