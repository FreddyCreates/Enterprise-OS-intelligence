export class CommandParser {
  constructor() {
    this.patterns = [];
  }

  registerCommand(pattern, handler = null) {
    this.patterns.push({ pattern, handler });
    return this;
  }

  parse(rawInput = "") {
    const [command, ...rest] = String(rawInput).trim().split(/\s+/).filter(Boolean);
    const params = {};
    const flags = [];

    rest.forEach((token) => {
      if (token.startsWith("--")) {
        const [key, value] = token.slice(2).split("=");
        if (value === undefined) flags.push(key);
        else params[key] = value;
      } else if (!params.target) {
        params.target = token;
      } else {
        flags.push(token);
      }
    });

    return {
      action: command || "",
      target: params.target ?? null,
      params,
      flags,
      raw: rawInput,
    };
  }

  validate(parsed) {
    return this.patterns.some(({ pattern }) =>
      pattern instanceof RegExp
        ? pattern.test(parsed.raw)
        : String(pattern).split(",").some((token) => token.trim() === parsed.action)
    );
  }

  suggest(partialInput = "") {
    const partial = String(partialInput).trim();
    return this.patterns
      .flatMap(({ pattern }) => (pattern instanceof RegExp ? [] : String(pattern).split(",")))
      .map((entry) => entry.trim())
      .filter((entry) => entry.startsWith(partial));
  }
}
