import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// 切换自定义域名时只改环境变量：SITE_URL=https://<domain> BASE_PATH=/
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://USERNAME.github.io',
  base: process.env.BASE_PATH ?? '/product-lab',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx()],
});
