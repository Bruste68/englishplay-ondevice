export const GOOGLE_CONFIG = {
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
  scopes: ['profile', 'email'],
};

export const FACEBOOK_CONFIG = {
  appId: process.env.FACEBOOK_APP_ID,
  permissions: ['public_profile', 'email'],
};