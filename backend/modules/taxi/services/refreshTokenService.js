import crypto from 'node:crypto';
import { ApiError } from '../../../utils/ApiError.js';
import { RefreshToken } from './refreshTokenModel.js';
import { signAccessToken } from './tokenService.js';

// Long enough that a normal user is never signed out by inactivity, while
// still bounded so an abandoned session eventually dies.
const REFRESH_TTL_DAYS = 180;

const hash = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');
const generateRawToken = () => crypto.randomBytes(48).toString('base64url');

export const issueRefreshToken = async ({ subjectId, role, rotatedFrom = null }) => {
  if (!subjectId || !role) {
    return null;
  }

  const raw = generateRawToken();

  await RefreshToken.create({
    tokenHash: hash(raw),
    subjectId: String(subjectId),
    role: String(role),
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    rotatedFrom,
  });

  return raw;
};

// Revoke every live token for a subject. Used on replay detection, and this is
// what makes "sign this account out everywhere" possible at all.
export const revokeAllForSubject = async (subjectId) => {
  if (!subjectId) return;

  await RefreshToken.updateMany(
    { subjectId: String(subjectId), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

export const revokeRefreshToken = async (raw) => {
  if (!raw) return;

  await RefreshToken.updateOne(
    { tokenHash: hash(raw), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

// Redeem a refresh token for a new access token, rotating the refresh token in
// the same step so a captured one is only ever good once.
export const rotateRefreshToken = async (raw) => {
  if (!raw) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const tokenHash = hash(raw);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Presented twice: the first use was legitimate, so this one is a replay of a
  // stolen token. Kill every session for the account rather than serve it.
  if (stored.usedAt) {
    await revokeAllForSubject(stored.subjectId);
    throw new ApiError(401, 'Refresh token already used');
  }

  if (stored.revokedAt) {
    throw new ApiError(401, 'Refresh token revoked');
  }

  if (new Date(stored.expiresAt).getTime() < Date.now()) {
    throw new ApiError(401, 'Refresh token expired');
  }

  stored.usedAt = new Date();
  await stored.save();

  const refreshToken = await issueRefreshToken({
    subjectId: stored.subjectId,
    role: stored.role,
    rotatedFrom: tokenHash,
  });

  return {
    token: signAccessToken({ sub: stored.subjectId, role: stored.role }),
    refreshToken,
    role: stored.role,
  };
};
