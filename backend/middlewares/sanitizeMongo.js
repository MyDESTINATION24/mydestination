// Strips MongoDB query operators from request input so a JSON body like
// {"email": {"$ne": null}} can never reach a Mongo query as an operator.
// Several login and lookup handlers pass req.body fields straight into
// findOne({ email }), where such an object matches the first document instead
// of an exact value -- a classic NoSQL auth-bypass vector. This neutralises it
// once, at the edge, for every route.
//
// Keys starting with '$' are operators; keys containing '.' are dotted-path
// selectors. Both are meaningless as literal field values in this app, so we
// drop them rather than try to escape them.
//
// req.query is a read-only getter in Express 5, so it is left untouched here;
// only req.body and req.params (still mutable) are cleaned in place. That is
// enough -- the injection sinks that matter all read from the body.

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const stripKeys = (value, depth = 0) => {
  // Guard against absurdly nested payloads walking the stack.
  if (depth > 20) return value;

  if (Array.isArray(value)) {
    for (const item of value) stripKeys(item, depth + 1);
    return value;
  }

  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
        continue;
      }
      stripKeys(value[key], depth + 1);
    }
  }

  return value;
};

export const sanitizeMongo = (req, _res, next) => {
  if (req.body) stripKeys(req.body);
  if (req.params) stripKeys(req.params);
  next();
};

// Exported for the self-check.
export const __sanitizeValue = stripKeys;
