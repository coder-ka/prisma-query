import fs from "fs/promises";
import { generatorHandler } from "@prisma/generator-helper";

export function main() {
  generatorHandler({
    async onGenerate(options) {
      try {
        const outpuPath = options.generator.output?.value;
        if (!outpuPath) {
          throw new Error("output path is required!");
        }

        const dmmf = options.dmmf;
        dmmf.datamodel.models;

        await fs.writeFile(
          outpuPath,
          `import { column, table } from "@coder-ka/query";

${dmmf.datamodel.models
  .map(
    (model) => `
export type ${model.name} = {${model.fields
      .filter((f) => f.kind === "scalar")
      .map(
        (f) => `
  ${f.name}: ${convertPrismaTypeToTS(f.type)};`
      )
      .join("")}
};
export const ${model.name} = table(
  "${model.name}",
  ${strOrNull(model.dbName)},
  {${model.fields
    .filter((f) => f.kind === "scalar")
    .map(
      (f) => `
    ${f.name}: column<${convertPrismaTypeToTS(f.type)}>('${f.name}', ['${
        model.name
      }']),`
    )
    .join("")}
  },
);`
  )
  .join("\n")}
`,
          "utf8"
        );
      } catch (e) {
        // Printing error stack traces to stdout because Prisma does not
        // print stack traces and stderr is used to communicate with Prisma.
        console.log(e);
        throw e;
      }
    },
  });

  function convertPrismaTypeToTS(type: string) {
    switch (type) {
      case "String":
        return "string";
      case "Boolean":
        return "boolean";
      case "Int":
        return "number";
      case "BigInt":
        return "bigint";
      case "Float":
        return "number";
      case "Decimal":
        return "string";
      case "DateTime":
        return "Date";
      case "Json":
        return "string";
      case "Bytes":
        return "Buffer";
      default:
        return type;
    }
  }

  function strOrNull(str: string | null): string {
    return str === null ? "null" : `"${str}"`;
  }
}
