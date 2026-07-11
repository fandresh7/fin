---
name: project-setup
description: Configura un proyecto Angular recién creado con lo básico (eslint, prettier, husky, lint-staged, tsconfig estricto, environments). Úsalo cuando el usuario entregue un proyecto Angular nuevo para dejarlo configurado, o pida configurar el proyecto/linting/environments.
---

# Setup básico de un proyecto Angular

Runbook autocontenido para configurar un proyecto Angular nuevo con tooling básico
(lint, formato, hooks de git, tsconfig estricto y environments). Cuando el usuario
entregue un proyecto nuevo (carpeta de un proyecto recién creado con `ng new` o similar)
para dejarlo configurado, aplicar esta guía directamente sin que el usuario tenga que
pedirlo paso a paso.

## 1. Dependencias a instalar

Siempre instalar las versiones más actuales (sin fijar versión).

```bash
npm install @angular/cdk

npm install -D \
  angular-eslint \
  eslint \
  eslint-config-prettier \
  eslint-plugin-prettier \
  typescript-eslint \
  husky \
  lint-staged \
  prettier-plugin-tailwindcss \
  @vitest/coverage-v8
```

Omitir `@angular/cdk` si el proyecto no lo necesita, y `prettier-plugin-tailwindcss` si
el proyecto no usa Tailwind.

## 2. Archivos de configuración

- **`eslint.config.js`** (crear en la raíz):

  ```js
  // @ts-check
  const eslint = require("@eslint/js");
  const { defineConfig } = require("eslint/config");
  const tseslint = require("typescript-eslint");
  const angular = require("angular-eslint");
  const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

  module.exports = defineConfig([
    {
      files: ["**/*.ts"],
      extends: [
        eslint.configs.recommended,
        tseslint.configs.recommended,
        tseslint.configs.stylistic,
        angular.configs.tsRecommended,
        eslintPluginPrettierRecommended
      ],
      processor: angular.processInlineTemplates,
      rules: {
        "@angular-eslint/directive-selector": "off",
        "@angular-eslint/component-selector": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }]
      },
    },
    {
      files: ["**/*.html"],
      ignores: ["dist/**"],
      extends: [
        angular.configs.templateRecommended,
        angular.configs.templateAccessibility,
        eslintPluginPrettierRecommended
      ],
      rules: {
        "@angular-eslint/template/interactive-supports-focus": "off",
        "@angular-eslint/template/click-events-have-key-events": "off"
      }
    }
  ]);
  ```

- **`.prettierrc`** (crear/reemplazar en la raíz):

  ```json
  {
    "tabWidth": 2,
    "useTabs": false,
    "singleQuote": true,
    "semi": false,
    "bracketSpacing": true,
    "arrowParens": "avoid",
    "trailingComma": "none",
    "bracketSameLine": true,
    "printWidth": 220,
    "endOfLine": "auto",
    "singleAttributePerLine": true,
    "overrides": [
      {
        "files": "**/*.html",
        "options": {
          "parser": "html"
        }
      },
      {
        "files": "**/*.component.html",
        "options": {
          "parser": "angular"
        }
      }
    ],
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```

  Quitar el bloque `plugins` si el proyecto no usa Tailwind.

- **`tsconfig.json`**: agregar `"strict": true` en `compilerOptions` y
  `"strictTemplates": true` en `angularCompilerOptions`.

- **`angular.json`**:
  - `cli.schematicCollections: ["angular-eslint"]`.
  - Agregar target `lint`:

    ```json
    "lint": {
      "builder": "@angular-eslint/builder:lint",
      "options": {
        "lintFilePatterns": [
          "src/**/*.ts",
          "src/**/*.html"
        ]
      }
    }
    ```

- **`package.json`**:
  - Scripts: `lint` (`ng lint`), `lint:fix` (`ng lint --fix`), `test:coverage`
    (`ng test --coverage`), `prepare` (`husky`).
  - Bloque `lint-staged`:

    ```json
    "lint-staged": {
      "**/*.{ts,html,css,scss}": ["eslint --fix"]
    }
    ```

- **Husky**: `npx husky init` y reemplazar el `.husky/pre-commit` generado (`npm test`)
  por `npx lint-staged`.

No copiar estilos ni componentes de otros proyectos, solo configuración.

## 3. Environments

Crear `src/environments/environment.ts` (producción) y `environment.development.ts`
(desarrollo) con al menos:

```ts
export const environment = {
  production: true // false en environment.development.ts
}
```

Ampliar con las variables propias del proyecto (URLs de API, feature flags, etc.) según
lo que el usuario indique.

En `angular.json`, dentro de `architect.build.configurations.development`, agregar:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

## 4. Verificación

Después de aplicar todo lo anterior:

```bash
npm run build
npm run build -- --configuration development
npm run lint
npm test
```

Todos deben pasar sin errores antes de dar el setup por terminado.
