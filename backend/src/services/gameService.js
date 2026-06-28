const steamService = require('./steamService');

async function upsertWishlistGames(prisma, user) {
  if (!user.steamId) return [];

  const games = await steamService.fetchSteamWishlist(user.steamId, user.region);

  for (const game of games) {
    const allTimeLowPrice = await steamService.fetchAllTimeLow(game.steamAppId);

    await prisma.game.upsert({
      where: { steamAppId: game.steamAppId },
      update: { ...game, allTimeLowPrice, lastUpdated: new Date() },
      create: { ...game, allTimeLowPrice }
    });
  }

  return games;
}

module.exports = { upsertWishlistGames };
