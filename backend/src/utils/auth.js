const jwt = require('jsonwebtoken');

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  steamId: true,
  region: true,
  whatsappNumber: true,
  whatsappEnabled: true
};

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    steamId: user.steamId,
    region: user.region,
    whatsappNumber: user.whatsappNumber,
    whatsappEnabled: user.whatsappEnabled
  };
}

function generateToken(user, secret) {
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' });
}

module.exports = { serializeUser, generateToken, USER_PUBLIC_FIELDS };
