export function getConfig(env = process.env) {
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  const databaseUrl = env.DATABASE_URL?.trim() || null;
  const sessionSecret = env.SESSION_SECRET?.trim() || null;
  const isProduction = env.NODE_ENV === 'production';
  if (isProduction && (!databaseUrl || !sessionSecret || sessionSecret.length < 32)) {
    throw new Error('Production requires DATABASE_URL and SESSION_SECRET of at least 32 characters');
  }
  const appOrigin = env.APP_ORIGIN ?? `http://127.0.0.1:${port}`;
  let parsedOrigin;
  try { parsedOrigin = new URL(appOrigin); } catch { throw new Error('APP_ORIGIN must be a valid HTTP(S) origin'); }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== appOrigin || (isProduction && parsedOrigin.protocol !== 'https:')) throw new Error('APP_ORIGIN must be an exact origin (HTTPS in production)');
  return {
    port,
    preview: env.UI_PREVIEW === 'true' && env.NODE_ENV !== 'production',
    databaseUrl,
    sessionSecret,
    isProduction: env.NODE_ENV === 'production',
    appOrigin
  };
}

export default getConfig();
