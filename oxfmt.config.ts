import base, { tailwind } from '@erakor/toolchain/oxfmt'

const config = { ...base, sortTailwindcss: tailwind('src/app/globals.css') }

export default config
