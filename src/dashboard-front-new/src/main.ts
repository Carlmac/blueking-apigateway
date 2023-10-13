import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './app.vue';
import i18n from './language/i18n';
import './css/index.css';

// 全量引入 bkui-vue
import bkui from 'bkui-vue';
// 全量引入 bkui-vue 样式
import 'bkui-vue/dist/style.css';
// 图标
import './assets/iconfont/style.css';

createApp(App)
  .use(i18n)
  .use(router)
  .use(createPinia())
  .use(bkui)
  .mount('.app');
