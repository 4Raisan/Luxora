const CHEAPSHARK_BASE_URL = process.env.CHEAPSHARK_BASE_URL || 'https://www.cheapshark.com/api/1.0';

const REGION_MAP = {
  USD: 'us',
  EUR: 'eu',
  GBP: 'gb',
  INR: 'in',
  BRL: 'br'
};

const normalizePrice = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return Number(value.toFixed(2));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
};

const parseSteamWishlistPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return [];

  return Object.entries(payload).map(([appId, game]) => {
    const appid = Number(appId);
    const finalPriceCents = game?.subs?.[0]?.price ?? null;
    const originalPriceCents = game?.subs?.[0]?.discount_pct
      ? Math.round(finalPriceCents / (1 - game.subs[0].discount_pct / 100))
      : finalPriceCents;

    return {
      steamAppId: appid,
      name: game?.name || `App ${appid}`,
      imageUrl: game?.capsule || null,
      currentPrice: finalPriceCents == null ? null : normalizePrice(finalPriceCents / 100),
      originalPrice: originalPriceCents == null ? null : normalizePrice(originalPriceCents / 100),
      discountPercent: game?.subs?.[0]?.discount_pct ?? 0
    };
  });
};

async function fetchSteamWishlist(steamId, region = 'USD') {
  const country = REGION_MAP[region] || 'us';

  const apiUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${steamId}`;
  const fallbackUrl = `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/?l=english&cc=${country}`;

  try {
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();
      const items = data?.response?.items || [];
      if (Array.isArray(items) && items.length) {
        return items.map((item) => ({
          steamAppId: item.appid,
          name: item.name || `App ${item.appid}`,
          imageUrl: item.capsule || null,
          currentPrice: normalizePrice(item?.price?.final / 100),
          originalPrice: normalizePrice(item?.price?.original / 100),
          discountPercent: item?.price?.discount_percent ?? 0
        }));
      }
    } else {
      console.warn(`[Steam] Primary API returned status ${response.status}, falling back`);
    }
  } catch (primaryError) {
    console.warn('[Steam] Primary API request failed, falling back:', primaryError.message);
  }

  const fallbackResponse = await fetch(fallbackUrl);
  if (!fallbackResponse.ok) {
    throw new Error(`Steam wishlist request failed with status ${fallbackResponse.status}`);
  }

  const fallbackData = await fallbackResponse.json();
  return parseSteamWishlistPayload(fallbackData);
}

async function fetchGameDetails(appId) {
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);

  if (!response.ok) {
    throw new Error(`Steam appdetails request failed with status ${response.status}`);
  }

  const data = await response.json();
  const payload = data?.[appId]?.data;

  if (!payload) {
    return null;
  }

  return {
    steamAppId: appId,
    name: payload.name,
    imageUrl: payload.header_image,
    currentPrice: normalizePrice(payload?.price_overview?.final / 100),
    originalPrice: normalizePrice(payload?.price_overview?.initial / 100),
    discountPercent: payload?.price_overview?.discount_percent ?? 0
  };
}

async function fetchAllTimeLow(steamAppId) {
  try {
    const response = await fetch(`${CHEAPSHARK_BASE_URL}/games?steamAppID=${steamAppId}`);

    if (!response.ok) {
      console.warn(`[CheapShark] Request failed with status ${response.status} for appId ${steamAppId}`);
      return null;
    }

    const data = await response.json();
    const firstResult = Array.isArray(data) ? data[0] : null;

    if (!firstResult?.cheapest) {
      return null;
    }

    return normalizePrice(firstResult.cheapest);
  } catch (error) {
    console.error(`[CheapShark] Failed to fetch ATL for appId ${steamAppId}:`, error.message);
    return null;
  }
}

module.exports = {
  fetchSteamWishlist,
  fetchGameDetails,
  fetchAllTimeLow
};
