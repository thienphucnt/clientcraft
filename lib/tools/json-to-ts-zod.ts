export interface JsonConvertOptions {
  rootName?: string;
  useTypeAlias?: boolean; // type Root = { ... } vs interface Root { ... }
  optionalFields?: boolean;
  detectIsoDates?: boolean;
  exportKeywords?: boolean;
}

export interface JsonConvertResult {
  typescript: string;
  zod: string;
  error?: string;
}

function toPascalCase(str: string): string {
  if (!str) return "Item";
  const cleaned = str.replace(/[^a-zA-Z0-9]/g, " ");
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("") || "Type";
}

function formatKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

interface GeneratedType {
  name: string;
  tsBody: string;
  zodBody: string;
}

export function convertJsonToTsAndZod(
  jsonInput: string,
  options: JsonConvertOptions = {}
): JsonConvertResult {
  const rootName = toPascalCase(options.rootName?.trim() || "Root");
  const useType = options.useTypeAlias ?? false;
  const optional = options.optionalFields ?? false;
  const detectDates = options.detectIsoDates ?? true;
  const exp = options.exportKeywords ?? true ? "export " : "";

  let parsed: unknown;
  try {
    if (!jsonInput.trim()) {
      return {
        typescript: "// Paste or type JSON to see TypeScript definitions",
        zod: '// Paste or type JSON to see Zod schemas\nimport { z } from "zod";',
      };
    }
    parsed = JSON.parse(jsonInput);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Invalid JSON string";
    return {
      typescript: `// JSON Parse Error:\n// ${errorMsg}`,
      zod: `// JSON Parse Error:\n// ${errorMsg}`,
      error: errorMsg,
    };
  }

  const generatedTypes: GeneratedType[] = [];
  const typeNameCounters = new Map<string, number>();

  function getUniqueTypeName(baseName: string): string {
    const pascal = toPascalCase(baseName);
    const count = typeNameCounters.get(pascal) || 0;
    typeNameCounters.set(pascal, count + 1);
    return count === 0 ? pascal : `${pascal}${count + 1}`;
  }

  function analyze(val: unknown, suggestedName: string): { ts: string; zod: string } {
    if (val === null) {
      return { ts: "null", zod: "z.null()" };
    }
    if (typeof val === "boolean") {
      return { ts: "boolean", zod: "z.boolean()" };
    }
    if (typeof val === "number") {
      return { ts: "number", zod: "z.number()" };
    }
    if (typeof val === "string") {
      if (detectDates && ISO_DATE_REGEX.test(val)) {
        return { ts: "string", zod: "z.string().datetime()" };
      }
      return { ts: "string", zod: "z.string()" };
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return { ts: "any[]", zod: "z.array(z.any())" };
      }

      // Check types of array elements
      const elementResults = val.map((item) =>
        analyze(item, suggestedName.endsWith("s") ? suggestedName.slice(0, -1) : `${suggestedName}Item`)
      );

      // Unique types
      const uniqueTs = Array.from(new Set(elementResults.map((r) => r.ts)));
      const uniqueZod = Array.from(new Set(elementResults.map((r) => r.zod)));

      if (uniqueTs.length === 1) {
        return {
          ts: `${uniqueTs[0]}[]`,
          zod: `z.array(${uniqueZod[0]})`,
        };
      } else {
        const unionTs = uniqueTs.join(" | ");
        const unionZod = `z.union([${uniqueZod.join(", ")}])`;
        return {
          ts: `(${unionTs})[]`,
          zod: `z.array(${unionZod})`,
        };
      }
    }

    if (typeof val === "object") {
      const typeName = getUniqueTypeName(suggestedName);
      const entries = Object.entries(val as Record<string, unknown>);

      const tsLines: string[] = [];
      const zodLines: string[] = [];

      for (const [key, propVal] of entries) {
        const sub = analyze(propVal, key);
        const formattedKey = formatKey(key);
        const isOpt = optional || propVal === null;
        const optMarker = isOpt ? "?" : "";

        tsLines.push(`  ${formattedKey}${optMarker}: ${sub.ts};`);

        let zodField = sub.zod;
        if (isOpt) {
          zodField = `${zodField}.optional()`;
        }
        zodLines.push(`  ${formattedKey}: ${zodField},`);
      }

      const tsBody = tsLines.join("\n");
      const zodBody = zodLines.join("\n");

      generatedTypes.push({
        name: typeName,
        tsBody,
        zodBody,
      });

      return {
        ts: typeName,
        zod: `${typeName}Schema`,
      };
    }

    return { ts: "any", zod: "z.any()" };
  }

  // Kick off analysis
  const rootType = analyze(parsed, rootName);

  // If root was a primitive or array without sub-objects
  if (generatedTypes.length === 0) {
    const tsCode = useType
      ? `${exp}type ${rootName} = ${rootType.ts};\n`
      : `${exp}type ${rootName} = ${rootType.ts};\n`;
    const zodCode = `import { z } from "zod";\n\n${exp}const ${rootName}Schema = ${rootType.zod};\n${exp}type ${rootName} = z.infer<typeof ${rootName}Schema>;\n`;
    return { typescript: tsCode, zod: zodCode };
  }

  // Format TypeScript Output
  let tsOutput = "";
  for (const gen of generatedTypes) {
    if (useType) {
      tsOutput += `${exp}type ${gen.name} = {\n${gen.tsBody}\n};\n\n`;
    } else {
      tsOutput += `${exp}interface ${gen.name} {\n${gen.tsBody}\n}\n\n`;
    }
  }

  // Format Zod Output
  let zodOutput = `import { z } from "zod";\n\n`;
  for (const gen of generatedTypes) {
    zodOutput += `${exp}const ${gen.name}Schema = z.object({\n${gen.zodBody}\n});\n`;
    zodOutput += `${exp}type ${gen.name} = z.infer<typeof ${gen.name}Schema>;\n\n`;
  }

  return {
    typescript: tsOutput.trim(),
    zod: zodOutput.trim(),
  };
}
