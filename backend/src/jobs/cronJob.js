const cron = require('node-cron');
const { upsertWishlistGames } = require('../services/gameService');
const { sendWhatsAppAlert } = require('../services/whatsappService');
const steamService = require('../services/steamService');

async function syncAndNotify(prisma, user) {
  const games = await upsertWishlistGames(prisma, user);

  for (const game of games) {
    const allTimeLowPrice = await steamService.fetchAllTimeLow(game.steamAppId);

    if (
      user.whatsappEnabled &&
      user.whatsappNumber &&
      game.currentPrice != null &&
      allTimeLowPrice != null &&
      game.currentPrice <= allTimeLowPrice
    ) {
      const message = `🎮 ${game.name} hit all-time low (${allTimeLowPrice}) in your Steam wishlist!`;
      await sendWhatsAppAlert(user.whatsappNumber, message);
      await prisma.notificationLog.create({
        data: { userId: user.id, message }
      });
    }
  }

  return games;
}

async function runForAllUsers(prisma, label) {
  const users = await prisma.user.findMany({ where: { steamId: { not: null } } });
  for (const user of users) {
    try {
      await syncAndNotify(prisma, user);
    } catch (error) {
      console.error(`[Cron] ${label} failed for user ${user.id}:`, error.message);
    }
  }
}

function startPriceTrackingJobs(prisma) {
  cron.schedule('0 * * * *', () => runForAllUsers(prisma, 'Hourly update'));
  cron.schedule('0 9 * * *', () => runForAllUsers(prisma, 'Daily ATL check'));
}

module.exports = {
  startPriceTrackingJobs,
  syncAndNotify
};
