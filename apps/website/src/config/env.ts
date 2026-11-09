export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL as string,
  mobileAppUrl: process.env.NEXT_PUBLIC_MOBILE_APP_URL as string,
} as const;

