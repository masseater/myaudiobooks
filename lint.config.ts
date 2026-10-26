import { presets as effectPresets } from "@effect/tsgo/oxlint-presets";
import eslintReact from "@eslint-react/eslint-plugin";
import htmlReact from "@html-eslint/eslint-plugin-react";
import { plugin as shadcn } from "@shadcn/lint";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import tanstackRouter from "@tanstack/eslint-plugin-router";
import { Array as Arr, Record as Rec, String as Str, Struct, pipe } from "effect";
import baselineJs from "eslint-plugin-baseline-js";
import reactHooks from "eslint-plugin-react-hooks";

const REACT_STATE_HOOKS: readonly string[] = [
  "useState",
  "useReducer",
  "createContext",
  "useContext",
];
const HAND_WRITTEN_SQL = "SQL を手書きせず Drizzle のクエリビルダーを使う";

const requiredStack: Readonly<Record<string, readonly string[]>> = {
  "UI 状態は effect-atom だけで扱う": [
    "zustand",
    "jotai",
    "valtio",
    "recoil",
    "mobx",
    "mobx-*",
    "redux",
    "@reduxjs/*",
    "react-redux",
    "xstate",
    "@xstate/*",
    "nanostores",
    "@nanostores/*",
    "@preact/signals*",
  ],
  "サーバー状態は TanStack Query と Eden だけで扱う": [
    "swr",
    "react-query",
    "@apollo/*",
    "urql",
    "@urql/*",
    "axios",
    "ky",
    "ofetch",
    "got",
    "node-fetch",
    "graphql-request",
    "@trpc/*",
  ],
  "ルーティングとサーバーは TanStack Start と Elysia だけで扱う": [
    "react-router",
    "react-router-dom",
    "next",
    "@remix-run/*",
    "wouter",
    "express",
    "hono",
    "fastify",
    "koa",
    "@nestjs/*",
  ],
  "データベースは Drizzle だけで扱い、スキーマはマイグレーションで生成する": [
    "prisma",
    "@prisma/*",
    "typeorm",
    "sequelize",
    "kysely",
    "knex",
    "@mikro-orm/*",
    "better-sqlite3",
    "pg",
    "mysql2",
  ],
  "認証は better-auth だけで扱う": [
    "next-auth",
    "@auth/*",
    "lucia",
    "passport",
    "passport-*",
    "@clerk/*",
    "firebase/auth",
    "@supabase/*",
  ],
  "UI は shadcn/ui と Tailwind CSS だけで組む": [
    "@mui/*",
    "antd",
    "@chakra-ui/*",
    "@mantine/*",
    "styled-components",
    "@emotion/*",
    "bootstrap",
    "react-bootstrap",
  ],
  "検証、日時、ログ、関数型ユーティリティは Effect だけで扱う": [
    "zod",
    "yup",
    "joi",
    "valibot",
    "arktype",
    "io-ts",
    "superstruct",
    "moment",
    "dayjs",
    "date-fns",
    "luxon",
    "winston",
    "pino",
    "bunyan",
    "loglevel",
    "lodash",
    "lodash-es",
    "ramda",
    "rxjs",
    "fp-ts",
    "neverthrow",
    "ts-results",
    "purify-ts",
  ],
  "フィーチャーフラグは OpenFeature だけで扱う": [
    "launchdarkly-*",
    "@launchdarkly/*",
    "@growthbook/*",
    "unleash-client",
    "flagsmith",
    "@vercel/flags",
  ],
  "計装は Effect のトレーシングだけで扱う": ["@opentelemetry/*", "dd-trace", "newrelic"],
  "インフラは Alchemy の IaC と Cloudflare だけで扱い、wrangler は使わない": [
    "wrangler",
    "miniflare",
    "@cloudflare/vite-plugin",
    "@vercel/*",
    "@netlify/*",
    "aws-cdk",
    "aws-cdk-lib",
    "@pulumi/*",
    "cdktf",
  ],
};

const requiredStackEntries = pipe(
  Rec.toEntries(requiredStack),
  Arr.flatMap(([message, modules]) =>
    pipe(
      modules,
      Arr.map((module) => ({ message, module })),
    ),
  ),
);

const requiredStackPaths: readonly Readonly<{ name: string; message: string }>[] = pipe(
  requiredStackEntries,
  Arr.filter(({ module }) => !pipe(module, Str.includes("*"))),
  Arr.map(({ message, module }) => ({ name: module, message })),
);

const requiredStackPatterns: readonly Readonly<{ group: readonly string[]; message: string }>[] =
  pipe(
    requiredStackEntries,
    Arr.map(({ message, module }) => {
      if (pipe(module, Str.includes("*"))) {
        return { group: [module, `${module}/**`], message };
      }
      return { group: [`${module}/**`], message };
    }),
  );

const restrictedImports = {
  paths: [
    {
      name: "react",
      importNames: [...REACT_STATE_HOOKS],
      message: "UI 状態は effect-atom だけで扱う",
    },
    { name: "drizzle-orm", importNames: ["sql"], message: HAND_WRITTEN_SQL },
    { name: "drizzle-orm/sql", message: HAND_WRITTEN_SQL },
    ...requiredStackPaths,
  ],
  patterns: [...requiredStackPatterns],
};

const generated = [
  "**/routeTree.gen.ts",
  "**/generated/**",
  "**/drizzle/**/snapshot.json",
  ".claude/skills/**",
  ".claude/hooks/fallow-gate.sh",
  ".intent/**",
  "AGENTS.md",
  "skills-lock.json",
  "CHANGELOG.md",
];

type Rules = Rec.ReadonlyRecord<string, "error">;

const asErrors = (names: readonly string[]): Rules =>
  Rec.fromEntries(
    pipe(
      names,
      Arr.map((name) => [name, "error"] as const),
    ),
  );

const prefixed = (
  prefix: string,
  plugin: Readonly<{ rules: Rec.ReadonlyRecord<string, unknown> }>,
): Rules =>
  asErrors(
    pipe(
      Rec.keys(plugin.rules),
      Arr.map((rule) => `${prefix}/${rule}`),
    ),
  );

const tanstackQueryRules = prefixed("tanstack-query", tanstackQuery);

const tanstackRouterRules = prefixed("tanstack-router", tanstackRouter);

const shadcnRules = prefixed("shadcn", shadcn);

const baselineJsRules = prefixed("baseline-js", baselineJs);

const reactHooksRuleNames = pipe(
  Struct.keys(reactHooks.configs["recommended-latest"].rules),
  Arr.map(Str.replace("react-hooks/", "react-hooks-js/")),
);

const reactHooksRules = asErrors(reactHooksRuleNames);

const eslintReactRuleNames = pipe(
  Struct.keys(eslintReact.configs["strict-typescript"].rules ?? {}),
  Arr.filter(
    (name) => !(pipe(name, Str.replace("@eslint-react/", "react-hooks-js/")) in reactHooksRules),
  ),
);

const eslintReactRules = asErrors(eslintReactRuleNames);

const htmlReactRules = asErrors(Struct.keys(htmlReact.configs.all.rules ?? {}));

const effectRuleNames = pipe(
  Rec.values(effectPresets),
  Arr.flatMap((preset) => Struct.keys(preset.rules ?? {})),
);

const effectRules = asErrors(effectRuleNames);

export {
  baselineJsRules,
  effectRules,
  eslintReactRules,
  generated,
  htmlReactRules,
  reactHooksRules,
  requiredStack,
  restrictedImports,
  shadcnRules,
  tanstackQueryRules,
  tanstackRouterRules,
};
