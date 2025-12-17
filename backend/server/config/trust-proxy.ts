export const shouldTrustProxy = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';
