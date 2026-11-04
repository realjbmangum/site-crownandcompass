export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return nextResolve(specifier, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err && err.code === 'ERR_MODULE_NOT_FOUND' && !specifier.endsWith('.ts') && !specifier.endsWith('.js')) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw err;
  }
}
