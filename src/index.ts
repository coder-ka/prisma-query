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

        const mode = options.generator.config.mode as
          | "query-module-test"
          | undefined;

        const dmmf = options.dmmf;
        dmmf.datamodel.models;

        await fs.writeFile(
          outpuPath,
          `import { column, table } from "${
            mode === "query-module-test" ? "../src/main" : "@coder-ka/query"
          }";
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
export const ${model.dbName || model.name} = table(
  "${model.dbName || model.name}",
  {${model.fields
    .filter((f) => f.kind === "scalar")
    .map(
      (f) => `
    ${f.name}: column<${convertPrismaTypeToTS(f.type)}>('${f.name}', ['${
        model.dbName || model.name
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
}
