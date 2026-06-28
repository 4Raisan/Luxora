const cron = require('node-cron');
const steamService = require('../services/steamService');
const { sendWhatsAppAlert } = require('../services/whatsappService');

async function upsertWishlistGames(prisma, user) {
  if (!user.steamId) return [];

  const games = await steamService.fetchSteamWishlist(user.steamId, user.region);

  for (const game of games) {
    const allTimeLowPrice = await steamService.fetchAllTimeLow(game.steamAppId);

    await prisma.game.upsert({
      where: { steamAppId: game.steamAppId },
      update: {
        ...game,
        allTimeLowPrice,
        lastUpdated: new Date()
      },
      create: {
        ...game,
        allTimeLowPrice
      }
    });

    if (
      user.whatsappEnabled &&
      user.whatsappNumber &&
      game.currentPrice != null &&
      allTimeLowPrice != null &&
      game.currentPrice <= allTimeLowPrice
    ) {
      const message = `🎮 ${game.name} hit all-time low (${allTimeLowPrice}) in your Steam wishlist!`;
      try {
        await sendWhatsAppAlert(user.whatsappNumber, message);
        await prisma.notificationLog.create({
          data: {
            userId: user.id,
            message
          }
        });
      } catch (alertError) {
        console.error(`[Cron] WhatsApp alert failed for user ${user.id}, game ${game.steamAppId}:`, alertError.message);
      }
    }
  }

  return games;
}

function startPriceTrackingJobs(prisma) {
  cron.schedule('0 * * * *', async () => {
    try {
      const users = await prisma.user.findMany({ where: { steamId: { not: null } } });
      for (const user of users) {
        try {
          await upsertWishlistGames(prisma, user);
        } catch (error) {
          console.error(`[Cron] Hourly update failed for user ${user.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[Cron] Hourly job failed to fetch users:', error.message);
    }
  });

  cron.schedule('0 9 * * *', async () => {
    try {
      const users = await prisma.user.findMany({ where: { steamId: { not: null } } });
      for (const user of users) {
        try {
          await upsertWishlistGames(prisma, user);
        } catch (error) {
          console.error(`[Cron] Daily ATL check failed for user ${user.id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[Cron] Daily job failed to fetch users:', error.message);
    }
  });
}

module.exports = {
  startPriceTrackingJobs,
  upsertWishlistGames
};
