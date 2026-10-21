export function getConfig(env = process.env) {
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  const databaseUrl = env.DATABASE_URL?.trim() || null;
  const sessionSecret = env.SESSION_SECRET?.trim() || null;
  const isProduction = env.NODE_ENV === 'production';
  if (isProduction && (!databaseUrl || !sessionSecret || sessionSecret.length < 32)) {
    throw new Error('Production requires DATABASE_URL and SESSION_SECRET of at least 32 characters');
  }
  return {
    port,
    preview: env.UI_PREVIEW === 'true' && env.NODE_ENV !== 'production',
    databaseUrl,
    sessionSecret,
    isProduction: env.NODE_ENV === 'production',
    appOrigin: env.APP_ORIGIN ?? `http://127.0.0.1:${port}`
  };
}

export default getConfig();
