/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

<template>
  <!--  文档详情主内容  -->
  <div class="content-wrap">
    <main
      v-if="api"
      ref="detailWrapRef"
      class="target-detail custom-scroll-bar"
    >
      <header class="detail-header">
        <header class="res-name">
          {{ api.name ?? '--' }}
        </header>
        <footer class="res-header-footer">
          <main class="res-desc">
            {{ api.description ?? '--' }}
          </main>
          <aside class="res-sdk">
            <span
              class="text-12px"
              @click="handleSdkInstructionClick"
            >
              <AgIcon name="document" />
              {{ t('SDK 使用说明') }}
            </span>
          </aside>
        </footer>
      </header>
      <main class="detail-main">
        <article class="res-basics">
          <section class="basic-cell">
            <span>
              <span class="label">{{ t('更新时间') }}</span>：
              {{ updatedTime ?? '--' }}
            </span>
          </section>
          <section class="basic-cell">
            <span>
              <span
                v-bk-tooltips="appVerifiedTooltips"
                class="label"
              >
                {{ t('应用认证') }}
              </span>：
              {{ api.verified_app_required ? t('是') : t('否') }}
            </span>
          </section>
          <section class="basic-cell">
            <span>
              <span
                v-bk-tooltips="resourcePermTooltips"
                class="label"
              >
                {{ t('权限申请') }}
              </span>：
              {{ (api.allow_apply_permission || api.component_permission_required) ? t('是') : t('否') }}
            </span>
          </section>
          <section class="basic-cell">
            <span>
              <span
                v-bk-tooltips="userVerifiedTooltips"
                class="label"
              >
                {{ t('用户认证') }}
              </span>：
              {{ api.verified_user_required ? t('是') : t('否') }}
            </span>
          </section>
        </article>
        <!--  API markdown 文档  -->
        <article
          v-if="markdownHtml"
          class="res-detail-content"
        >
          <div
            id="resMarkdown"
            v-dompurify-html="markdownHtml"
            class="ag-markdown-view"
          />
        </article>
      </main>
    </main>
    <!--  右侧导航栏  -->
    <aside class="detail-nav-box">
      <DocDetailSideNav
        v-model="activeDocHeadingId"
        :list="navList"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import DocDetailSideNav from './DocDetailSideNav.vue';
import type {
  IComponent,
  INavItem,
  IResource,
  TabType,
} from '../types.d.ts';
import { copy } from '@/utils';
import {
  useElementBounding,
  useScroll,
} from '@vueuse/core';
import { minBy } from 'lodash-es';

interface IProps {
  api: IResource & IComponent | null
  navList: INavItem[]
  markdownHtml: string
  updatedTime: string
}

const {
  api = null,
  navList = [],
  markdownHtml = '',
  updatedTime = null,
} = defineProps<IProps>();

const emit = defineEmits<{ 'show-sdk-instruction': [void] }>();

const { t } = useI18n();

// 注入当前的总 tab 变量
const curTab = inject<Ref<TabType>>('curTab');

const detailWrapRef = ref<HTMLElement | null>(null);
// API 文档大标题元素集合
const docHeadingElements = ref<HTMLElement[]>([]);
// 当前应该高亮右侧导航的文档标题ID
const activeDocHeadingId = ref('');
const { y } = useScroll(detailWrapRef, {
  // 监听 API 文档容器的滚动结束事件，获取距离容器最上方且可见的标题元素
  onStop: () => {
    const topVisibleHeading = minBy(docHeadingElements.value, (el) => {
      const { top } = useElementBounding(el);
      const offsetTop = top.value - 100;
      return offsetTop > 0 ? offsetTop : Infinity;
    });
    activeDocHeadingId.value = topVisibleHeading?.id || '';
  },
});

const appVerifiedTooltips = computed(() => {
  if (curTab.value === 'gateway') return t('应用访问该网关API时，是否需提供应用认证信息');
  if (curTab.value === 'component') return t('应用访问该组件API时，是否需提供应用认证信息');
  return '--';
});

const resourcePermTooltips = computed(() => {
  if (curTab.value === 'gateway') return t('应用访问该网关API前，是否需要在开发者中心申请该网关API权限');
  if (curTab.value === 'component') return t('应用访问该组件API前，是否需要在开发者中心申请该组件API权限');
  return '--';
});

const userVerifiedTooltips = computed(() => {
  if (curTab.value === 'gateway') return t('应用访问该网关API时，是否需要提供用户认证信息');
  if (curTab.value === 'component') return t('应用访问该组件API时，是否需要提供用户认证信息');
  return '--';
});

watch(
  () => markdownHtml,
  () => {
    initMarkdownHtml('resMarkdown');
  },
);

// 切换 api 时滚动到顶部
watch(
  () => api,
  () => {
    if (y.value === 0) return;
    nextTick(() => {
      y.value = 0;
    });
  },
);

const initMarkdownHtml = (box: string) => {
  docHeadingElements.value = [];
  nextTick(() => {
    const markdownDom = document.getElementById(box);
    // 复制代码
    markdownDom?.querySelectorAll('a')?.forEach((item) => {
      item.target = '_blank';
    });
    markdownDom?.querySelectorAll('pre')?.forEach((item) => {
      const parentDiv = document.createElement('div');
      const btn = document.createElement('button');
      const codeBox = document.createElement('div');
      const code = item?.querySelector('code')?.innerText;
      parentDiv.className = 'pre-wrapper';
      btn.className = 'ag-copy-btn';
      codeBox.className = 'code-box';
      btn.innerHTML = '<span title="复制"><i class="apigateway-icon icon-ag-copy-info"></i></span>';
      btn.setAttribute('data-copy', code);
      parentDiv?.appendChild(btn);
      codeBox?.appendChild(item?.querySelector('code'));
      item?.appendChild(codeBox);
      item?.parentNode?.replaceChild(parentDiv, item);
      parentDiv?.appendChild(item);
    });
    // 获取文档中的标题元素，它们的 id 以 doc-heading- 开头
    docHeadingElements.value = Array.from(document.querySelectorAll('.target-detail [id^=doc-heading-]'));

    setTimeout(() => {
      const copyDoms = Array.from(document.getElementsByClassName('ag-copy-btn'));

      const handleCopy = function (this: any) {
        copy(this.dataset?.copy);
      };

      copyDoms.forEach((dom: any) => {
        dom.onclick = handleCopy;
      });
    }, 1000);
  });
};

const handleSdkInstructionClick = () => {
  emit('show-sdk-instruction');
};

</script>

<style scoped lang="scss">
@use "sass:color";

$primary-color: #3a84ff;
$code-bc: #1e1e1e;
$code-color: #63656e;

.content-wrap {
  display: flex;
  align-items: flex-start;

  .target-detail {
    height: calc(100vh - 144px);
    padding-right: 8px;
    padding-left: 8px;
    overflow-y: scroll;
    flex-grow: 1;

    .detail-header {
      margin-bottom: 16px;

      .res-name {
        margin-bottom: 4px;
        font-size: 20px;
        font-weight: 700;
        line-height: 28px;
        color: #313238;
      }

      .res-header-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .res-desc {
          font-size: 14px;
          line-height: 22px;
          letter-spacing: 0;
          color: #979ba5;
        }

        .res-sdk {
          color: #3a84ff;
          cursor: pointer;
        }
      }
    }

    .detail-main {
      container-type: inline-size;

      .res-basics,
      .res-detail-content {
        padding: 24px;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 0 2px 4px 0 #1919290d;
      }

      .res-basics {
        display: grid;
        margin-bottom: 16px;
        grid-template-columns: 280px 280px;
        grid-template-rows: 40px 40px;

        @container (width < 640px) {
          padding-block: 12px;
          grid-template-columns: 1fr;
          grid-template-rows: 40px 40px 40px 40px;
        }

        .basic-cell {
          display: flex;
          align-items: center;
          line-height: 22px;
          color: #313238;

          .label {
            font-size: 14px;
            color: #63656e;
            border-bottom: 1px dashed #979ba5;
          }

          &:first-of-type .label {
            border: none;
          }
        }
      }
    }

  }

  .detail-nav-box {
    padding-left: 12px;
  }
}

.custom-scroll-bar {

  &::-webkit-scrollbar {
    width: 4px;
    background-color: color.scale(#c4c6cc, $lightness: 80%);
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: #c4c6cc;
  }

  &::-webkit-scrollbar-thumb {
    height: 5px;
    background-color: #f5f7fb;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f5f7fb;
  }
}

:deep(.ag-markdown-view) {
  font-size: 14px;
  font-style: normal;
  line-height: 19px;
  color: $code-color;
  text-align: left;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    padding: 0;
    margin: 25px 0 10px !important;
    font-weight: bold;
    line-height: 22px;
    color: #313238;
    text-align: left;
  }

  h1 {
    font-size: 18px;
  }

  h2 {
    font-size: 17px;
  }

  h3 {
    font-size: 16px;

    &:first-of-type {
      margin-top: 0 !important;
    }
  }

  h4 {
    font-size: 13px;
  }

  h5 {
    font-size: 12px;
  }

  h6 {
    font-size: 12px;
  }

  p {
    font-size: 14px;
    line-height: 22px;
    color: $code-color;
    word-break: break-all;
    white-space: normal;
  }

  ul {
    padding-left: 17px;
    line-height: 22px;

    li {
      margin-bottom: 8px;
      list-style: disc;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  ol {
    padding-left: 15px;
    margin: 14px 0;
    line-height: 22px;

    li {
      margin-bottom: 8px;
      list-style: decimal;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  a {
    color: #3a84ff;
  }

  tt {
    padding: 0 5px;
    margin: 0 2px;
    font-size: 75%;
    white-space: nowrap;
    background-color: #f8f8f8;
    border: 1px solid #eaeaea;
    border-radius: 3px;
  }

  table {
    width: 100%;
    margin: 10px 0;
    font-size: 14px;
    font-style: normal;
    color: $code-color;
    text-align: left;
    border: 1px solid #dcdee5;

    &.field-list {

      th {
        width: 12%;
      }
    }

    em {
      font-style: normal;
    }

    th {
      min-width: 70px;
      padding: 10px;
      font-size: 13px;
      font-weight: bold;
      color: $code-color;
      background: #f0f1f5;
      border-bottom: 1px solid #dcdee5;

    }

    th:nth-child(1) {
      width: 20%;
    }

    td {
      max-width: 250px;
      padding: 10px;
      font-size: 13px;
      font-style: normal;
      color: $code-color;
      word-break: break-all;
      border-bottom: 1px solid #dcdee5;
    }
  }

  pre {
    position: relative;
    padding: 10px;
    margin: 14px 0;
    overflow: auto;
    font-size: 14px;
    line-height: 24px;
    text-align: left;
    background: $code-bc;
    border-radius: 2px;

    code {
      font-family: "Lucida Console", "Courier New", Monaco, monospace;
      color: #dcdcdc;
    }

    .hljs {
      margin: -10px;
    }
  }
}
</style>
