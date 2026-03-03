import rules from '@leapmotor/design-base/packages/stylelint/index.js'

export default {
  extends: [
    'stylelint-config-recommended',
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
    'stylelint-config-html'
  ],
  overrides: [
    {
      files: ['**/*.{html,vue}'],
    }
  ],
  rules: {
    ...rules
  }
}