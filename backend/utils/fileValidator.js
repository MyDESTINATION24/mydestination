/**
 * Security Utility: Validates genuine PK ZIP Magic Bytes for DOCX files
 */
export const validateDocxMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return false;

  // DOCX files are PK ZIP archives: Magic Bytes are 50 4B 03 04 ('PK\x03\x04')
  const isZipMagic =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  return isZipMagic;
};
