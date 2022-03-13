export const getWhitelistFromEnv = (whitelistFromEnv: string): string[] => {
  try {
    const whitelist = JSON.parse(whitelistFromEnv);
    return whitelist || [];
  } catch (error) {
    console.error(`Error generating whitelist from environment: ${error}`);
    return [];
  }
};
