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
          `// ^-^v
  import { column, table } from "../../src/main";
  
  export type ${prismaType("String")} = string;
  export type ${prismaType("Boolean")} = boolean;
  export type ${prismaType("Int")} = number;
  export type ${prismaType("BigInt")} = bigint;
  export type ${prismaType("Float")} = number;
  export type ${prismaType("Decimal")} = string;
  export type ${prismaType("DateTime")} = Date;
  export type ${prismaType("Json")} = string;
  export type ${prismaType("Bytes")} = Buffer;
  ${dmmf.datamodel.models
    .map(
      (model) => `
  export type ${model.name} = {${model.fields
        .filter((f) => f.kind === "scalar")
        .map(
          (f) => `
    ${f.name}: ${prismaType(f.type)};`
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
      ${f.name}: column<${prismaType(f.type)}>('${f.name}', ['${model.name}']),`
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

  function strOrNull(str: string | null): string {
    return str === null ? "null" : `"${str}"`;
  }

  function prismaType(type: string) {
    return "Prisma" + type;
  }
}
