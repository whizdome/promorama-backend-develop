const escapeStringRegExp = (string) => {
  if (typeof string !== 'string') {
    throw new Error('escapeStringRegExp: Expected a string');
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};

module.exports = escapeStringRegExp;
