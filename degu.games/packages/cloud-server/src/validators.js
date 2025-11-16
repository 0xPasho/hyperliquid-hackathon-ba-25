const naughty = require('./naughty');

/** List of possible prefixes that must appear at the beginning of all variable's names. */
const CLOUD_PREFIXES = ['☁ ', ':cloud: '];
/** The maximum length of a variable's name. Scratch does not seem to restrict this but we don't want overly long variable names regardless. */
const VARIABLE_NAME_MAX_LENGTH = 1024;

/** The maximum length of a variable's value. */
const VALUE_MAX_LENGTH = 100000;

/** Maximum length of usernames, inclusive. */
const USERNAME_MAX_LENGTH = 20;
/** Minimum length of usernames, inclusive. */
const USERNAME_MIN_LENGTH = 1;
/** Regex for usernames to match. Letters, numbers, -, and _ */
const USERNAME_REGEX = /^[a-z0-9_-]+$/i;

/**
 * @param {unknown} username
 * @returns {boolean}
 */
module.exports.isValidUsername = function(username) {
  return typeof username === 'string' && username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH && USERNAME_REGEX.test(username) && !naughty(username);
};

/**
 * @param {unknown} id
 * @returns {boolean}
 */
module.exports.isValidRoomID = function(id) {
  return typeof id === 'string' && id.length > 0 && id.length < 1000;
};

/**
 * @param {unknown} name
 * @returns {boolean}
 */
module.exports.isValidVariableName = function(name) {
  if (typeof name !== 'string') return false;
  if (name.length > VARIABLE_NAME_MAX_LENGTH) return false;
  for (const prefix of CLOUD_PREFIXES) {
    if (name === prefix) return false;
    if (name.startsWith(prefix)) return true;
  }
  return false;
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
module.exports.isValidVariableValue = function(value) {
  if (typeof value === 'number') {
    // If the value is a number, we don't have to parse it because we already know it's valid.
    // NaN and [-]Infinity are not valid, however.
    return !Number.isNaN(value) && Number.isFinite(value) && value.toString().length <= VALUE_MAX_LENGTH;
  }

  if (typeof value === 'string') {
    if (value.length > VALUE_MAX_LENGTH) {
      return false;
    }

    // Allow blockchain addresses (ethereum format: 0x followed by 40 hex characters)
    if (value.startsWith('0x') || value.startsWith('0X')) {
      // Check if it's a valid hex string after 0x
      if (value.length >= 3 && value.length <= 66) { // Allow up to 64 hex chars after 0x (256-bit addresses)
        const hexPart = value.slice(2);
        // Check if all characters after 0x are valid hex (0-9, a-f, A-F)
        const isValidHex = /^[0-9a-fA-F]+$/.test(hexPart);
        if (isValidHex) {
          return true;
        }
      }
    }

    // catch some special cases
    if (value === '.' || value === '-') {
      return false;
    }

    var length = value.length;
    var seenDecimal = false;
    var i = 0;
    // 45 = -
    if (value.charCodeAt(0) === 45) i++;

    for (; i < length; i++) {
      var char = value.charCodeAt(i);
      // 46 = .
      if (char === 46) {
        if (seenDecimal) return false;
        seenDecimal = true;
      } else {
        // 48 = 0
        // 57 = 9
        // all the numbers are between these
        if (char < 48 || char > 57) return false;
      }
    }

    return true;
  }

  return false;
};
