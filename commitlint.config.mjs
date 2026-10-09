import { readFileSync } from 'node:fs';

const clinicalRule = (parsed) => {
  const raw = parsed.raw || '';
  if (parsed.type !== 'clinical') return [true];

  const errors = [];
  if (!/^Refs:\s*.+$/m.test(raw)) {
    errors.push(
      'Los commits "clinical:" DEBEN incluir un footer "Refs:" (ej. "Refs: Maudsley 14th 4.3.2")'
    );
  }
  if (!/^Reviewer:\s*@.+$/m.test(raw)) {
    errors.push(
      'Los commits "clinical:" DEBEN incluir un footer "Reviewer: @username" del Revisor Mdico'
    );
  }
  return [errors.length === 0, errors.join('\n')];
};

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'clinical-requires-refs-and-reviewer': clinicalRule
      }
    }
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor', 'perf',
        'test', 'build', 'ci', 'chore', 'revert', 'clinical'
      ]
    ],
    'scope-enum': [
      1,
      'always',
      [
        'switching-matrix', 'data', 'ui', 'quiz', 'pdf',
        'i18n', 'ci', 'deps', 'docs', 'security', 'governance'
      ]
    ],
    'header-max-length': [2, 'always', 100],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'clinical-requires-refs-and-reviewer': [2, 'always']
  }
};
