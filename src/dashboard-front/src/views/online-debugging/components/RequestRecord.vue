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
  <AgSideslider
    v-model="isShow"
    :title="t('调用历史')"
    ext-cls="sutra-scrollbar"
  >
    <template #default>
      <div class="history-container">
        <div class="history-search">
          <BkInput
            v-model="filterData.resource_name"
            class="search-input"
            type="search"
            :placeholder="t('请输入资源名称')"
            @blur="getList()"
            @enter="getList()"
          />
          <BkDatePicker
            ref="topDatePicker"
            :key="dateKey"
            v-model="dateTimeRange"
            class="search-date"
            :placeholder="t('选择日期时间范围')"
            :type="'datetimerange'"
            :shortcuts="accessLogStore.datepickerShortcuts"
            shortcut-close
            use-shortcut-text
            :shortcut-selected-index="shortcutSelectedIndex"
            @shortcut-change="handleShortcutChange"
            @pick-success="handleTimeChange"
            @clear="handleTimeClear"
          />
        </div>

        <div class="history-data">
          <BkTable
            ref="tableRef"
            size="small"
            class="history-table"
            border="outer"
            :data="tableList"
            :row-style="{ cursor: 'pointer' }"
            show-overflow-tooltip
            :pagination="pagination"
            @row-click="handleRowClick"
          >
            <BkTableColumn
              :label="t('资源名称')"
              prop="resource_name"
            />
            <BkTableColumn
              :label="t('响应状态码')"
              prop="status_code"
              width="120"
            >
              <template #default="{ data }">
                <span
                  class="dot"
                  :class="[String(data?.response?.data?.status_code)?.startsWith('2') ? 'success' : 'failure']"
                />
                {{ data?.response?.data?.status_code }}
              </template>
            </BkTableColumn>
            <BkTableColumn
              :label="t('耗时')"
              prop="proxy_time"
              width="120"
            >
              <template #default="{ data }">
                {{ data?.response?.data?.proxy_time }} ms
              </template>
            </BkTableColumn>
            <BkTableColumn
              :label="t('调用时间')"
              prop="created_time"
            />
            <BkTableColumn
              :label="t('操作')"
              width="120"
            >
              <template #default="{ row }">
                <BkButton
                  theme="primary"
                  text
                  @click="(e: any) => handleShowDetails(e, row)"
                >
                  {{ t('请求详情') }}
                </BkButton>
              </template>
            </BkTableColumn>
            <template #expandRow="row">
              <div class="details-tab">
                <div class="tab-header">
                  <div class="header-title">
                    <div
                      v-for="item in tabList"
                      :key="item.id"
                      class="title"
                      :class="{ 'active': item.id === row?.activeIndex }"
                      @click="() => handleTabClick(row, item.id)"
                    >
                      {{ item.name }}
                    </div>
                  </div>
                  <div
                    v-show="row?.activeIndex !== 'requestHeader'"
                    class="header-copy"
                  >
                    <CopyShape @click="() => handleCopyDetails(row)" />
                  </div>
                </div>
                <div class="tab-content">
                  <div
                    v-show="row?.activeIndex === 'code'"
                    class="content-item code"
                    :class="`code-${row?.id}`"
                  >
                    <EditorMonaco
                      v-if="row?.editorText"
                      ref="resourceEditorRef"
                      v-model="row.editorText"
                      theme="Visual Studio"
                      language="json"
                      :minimap="false"
                      :show-copy="false"
                      read-only
                    />
                  </div>

                  <div
                    v-show="row?.activeIndex === 'url'"
                    class="content-item request-url"
                  >
                    <span class="tag">{{ row?.request?.request_method }}</span>
                    <span class="url">{{ row?.request?.request_url }}</span>
                  </div>

                  <div
                    v-show="row?.activeIndex === 'requestHeader'"
                    class="content-item request-header"
                  >
                    <BkTable
                      class="request-header-table"
                      size="small"
                      row-hover="auto"
                      header-align="left"
                      max-height="252px"
                      stripe
                      :columns="requestHeaderCols"
                      :data="() => getRequestHeader(row)"
                    />
                  </div>

                  <div
                    v-show="row?.activeIndex === 'requestBody'"
                    class="content-item request-body"
                    :class="`request-body-${row?.id}`"
                  >
                    <EditorMonaco
                      v-if="row?.requestBody"
                      v-model="row.requestBody"
                      theme="Visual Studio"
                      language="json"
                      :minimap="false"
                      :show-copy="false"
                      read-only
                    />
                  </div>

                  <div
                    v-show="row?.activeIndex === 'responseBody'"
                    class="content-item response-body"
                    :class="`response-body-${row?.id}`"
                  >
                    <EditorMonaco
                      v-if="row?.responseBody"
                      v-model="row.responseBody"
                      theme="Visual Studio"
                      language="json"
                      :minimap="false"
                      :show-copy="false"
                      read-only
                    />
                  </div>
                </div>
              </div>
            </template>
            <template #empty>
              <TableEmpty
                :keyword="tableEmptyConf.keyword"
                :abnormal="tableEmptyConf.isAbnormal"
                @reacquire="setSearchTimeRange"
                @clear-filter="handleClearFilterKey"
              />
            </template>
          </BkTable>
        </div>
      </div>
    </template>
  </AgSideslider>
</template>

<script lang="ts" setup>
import { useAccessLog, useGateway } from '@/stores';
import TableEmpty from '@/components/table-empty/Index.vue';
import EditorMonaco from '@/components/ag-editor/Index.vue';
import AgSideslider from '@/components/ag-sideslider/Index.vue';
import {
  getTestHistories,
  getTestHistoriesDetails,
} from '@/services/source/online-debugging';
import { CopyShape } from 'bkui-vue/lib/icon';
import { copy } from '@/utils';

const { t } = useI18n();
const gatewayStore = useGateway();
const accessLogStore = useAccessLog();

const isShow = ref<boolean>(false);
const filterData = ref<any>({
  resource_name: '',
  time_start: '',
  time_end: '',
});
const dateTimeRange = ref([]);
const dateKey = ref<string>('dateKey');
const topDatePicker = ref();
const shortcutSelectedIndex = shallowRef(-1);
const tableRef = ref();
const resourceEditorRef: any = ref<InstanceType<typeof EditorMonaco>>();
const tableList = ref<any>([]);
const tableEmptyConf = reactive<any>({
  keyword: '',
  isAbnormal: false,
});
let expandIds: number[] = [];
const pagination = ref<{
  count: number
  limit: number
}>({
  count: 0,
  limit: 10,
});
const tabList = ref([
  {
    name: t('请求代码'),
    id: 'code',
  },
  {
    name: t('请求URL'),
    id: 'url',
  },
  {
    name: 'Request Header',
    id: 'requestHeader',
  },
  {
    name: 'Request Body',
    id: 'requestBody',
  },
  {
    name: 'Response Body',
    id: 'responseBody',
  },
]);
const requestHeaderCols = [
  {
    label: t('名称'),
    field: 'name',
  },
  {
    label: t('值'),
    field: 'value',
  },
];

const apigwId = computed(() => gatewayStore.apigwId);

const handleTabClick = (row: Record<string, any>, id: string) => {
  row.activeIndex = id;
};

const handleCopyDetails = (row: Record<string, any>) => {
  const { activeIndex } = row;

  let copyValue = '';
  switch (activeIndex) {
    case 'code':
      copyValue = row.editorText;
      break;
    case 'url':
      copyValue = row.request.request_url;
      break;
    case 'requestBody':
      copyValue = row.requestBody;
      break;
    case 'responseBody':
      copyValue = row.responseBody;
      break;
  }

  copy(copyValue);
};

const getRequestHeader = (row: Record<string, any>) => {
  if (!row) return [];

  const { headers } = row.request;
  const keys = Object.keys(headers);

  if (!keys?.length) {
    return [];
  }

  return keys.map((key) => {
    return {
      name: key,
      value: headers[key],
    };
  });
};

const updateTableEmptyConfig = () => {
  if (filterData.value.resource_name || filterData.value.time_end) {
    tableEmptyConf.keyword = 'placeholder';
    return;
  }
  tableEmptyConf.keyword = '';
};

const handleShortcutChange = (value: Record<string, any>, index: number) => {
  shortcutSelectedIndex.value = index;
  updateTableEmptyConfig();
};

const formatDatetime = (timeRange: number[]) => {
  return [+new Date(`${timeRange[0]}`) / 1000, +new Date(`${timeRange[1]}`) / 1000];
};

const setSearchTimeRange = () => {
  let timeRange = dateTimeRange.value;
  // 选择的是时间快捷项，需要实时计算时间值
  if (shortcutSelectedIndex.value !== -1) {
    timeRange = accessLogStore.datepickerShortcuts[shortcutSelectedIndex.value].value();
  }
  const formatTimeRange = formatDatetime(timeRange);
  filterData.value = Object.assign(filterData.value, {
    time_start: formatTimeRange[0] || '',
    time_end: formatTimeRange[1] || '',
  });

  getList();
};

const handleTimeChange = () => {
  setSearchTimeRange();
};

const handleTimeClear = () => {
  shortcutSelectedIndex.value = -1;
  dateTimeRange.value = [];
  setSearchTimeRange();
};

const handleShowDetails = async (event: Event, row: Record<string, any>) => {
  event.stopPropagation();
  if (!row.isExpand) {
    await getDetails(row.id, row);
  }
  else {
    row.isExpand = !row.isExpand;
    expandIds = expandIds.filter((id: number) => id !== row.id);
    nextTick(() => {
      tableRef.value?.setRowExpand(row, row.isExpand);
    });
  }
};

const clear = () => {
  filterData.value.resource_name = '';
  filterData.value.time_start = '';
  filterData.value.time_end = '';
  shortcutSelectedIndex.value = -1;
  dateTimeRange.value = [];
};

const show = () => {
  clear();
  isShow.value = true;
  getList();
};

const getList = async () => {
  const data = {
    offset: 0,
    limit: 10000,
    ...filterData.value,
  };
  const response = await getTestHistories(apigwId.value, data);
  response?.forEach((item: any) => {
    item.editorText = '';
    item.requestBody = '';
    item.responseBody = '';
    item.activeIndex = 'code';
  });
  tableList.value = response;
  pagination.value.count = response?.length || 0;
  updateTableEmptyConfig();
};

const handleClearFilterKey = () => {
  clear();
  getList();
  dateKey.value = String(+new Date());
};

const getDetails = async (id: number, row: Record<string, any>) => {
  const response = await getTestHistoriesDetails(apigwId.value, id);

  row.editorText = response?.response?.data?.curl;
  row.requestBody = response?.request?.body;
  row.responseBody = response?.response?.data?.body;
  row.isExpand = !row.isExpand;
  expandIds.push(id);
  nextTick(() => {
    const editorTextLen = Math.ceil(row.editorText?.length / 200);
    const requestBodyLen = Math.ceil(row.requestBody?.length / 200);
    const responseBodyLen = Math.ceil(row.responseBody?.length / 200);

    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .code-${row.id} {
        height: ${editorTextLen * 100}px !important;
      }
      .request-body-${row.id} {
        height: ${requestBodyLen * 100}px !important;
      }
      .response-body-${row.id} {
        height: ${responseBodyLen * 100}px !important;
      }
    `;
    document.head.appendChild(styleElement);

    tableRef.value?.setRowExpand(row, row.isExpand);
  });
};

const handleRowClick = (event: Event, row: Record<string, any>) => {
  handleShowDetails(event, row);
};

// const getCellClass = (_column: any, _index: number, row: any) => {
//   if (expandIds.includes(row.id)) {
//     return 'td-highlight-bg';
//   }
//   return '';
// };

defineExpose({ show });
</script>

<style lang="scss" scoped>
.history-container {
  padding: 20px 24px;
  height: calc(100vh - 52px);
  box-sizing: border-box;
  .history-search {
    display: flex;
    align-items: center;
    margin-bottom: 18px;
    .search-input {
      width: 420px;
      margin-right: 8px;
    }
    .search-date {
      flex: 1;
    }
  }
}
.sutra-scrollbar {
  :deep(.bk-modal-content) {
    scrollbar-gutter: auto;
  }
  :deep(.bk-table-body) {
    scrollbar-gutter: auto;
  }
}

.details-tab {
  max-height: 600px;
  background: #f5f7fa;
  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .header-title {
      display: flex;
      align-items: center;
    }
    .header-copy {
      color: #4D4F56;
      margin-right: 18px;
      cursor: pointer;
    }
    .title {
      font-size: 12px;
      color: #313238;
      font-family: PingFangSC-Regular;
      font-weight: Regular;
      padding: 8px 24px;
      cursor: pointer;
      position: relative;
      &:not(:nth-last-child(1)) {
        &::after {
          content: ' ';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 10px;
          background: #DCDEE5;
        }
      }
      &.active {
        font-family: PingFangSC-Semibold;
        font-weight: bold;
        color: #313238;
        &::before {
          content: ' ';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 96px;
          height: 2px;
          background: #313238;
        }
      }
    }
  }
  .tab-content {
    .code,
    .request-body,
    .response-body {
      width: 100%;
      transition: all, .1s;
      min-height: 100px;
      max-height: 400px;
    }
    .response-body {
      min-height: 250px;
    }
    .request-url {
      padding: 12px 24px 24px;
      .tag {
        font-size: 10px;
        color: #299E56;
        background: #DAF6E5;
        border-radius: 8px;
        padding: 1px 4px;
      }
      .url {
        font-size: 12px;
        color: #313238;
        margin-left: 4px;
      }
    }
    .request-header {
      padding: 12px 24px 24px;
      border: 1px solid #F0F1F5;
    }
  }
}
</style>

<style lang="scss">
/* .td-highlight-bg {
  background: #f5f7fa !important;
} */

.request-header-table.bk-table .bk-table-body table tbody tr td {
  background: none !important;
}

.content-item {
  .monaco-editor, .monaco-editor-background, .monaco-editor .inputarea.ime-input {
    background-color: #f5f7fa !important;
  }
  .monaco-editor .margin {
    background-color: #f5f7fa !important;
  }
  .monaco-editor .line-numbers {
    color: #979BA5 !important;
  }
  .monaco-editor .current-line ~ .line-numbers {
    color: #979BA5 !important;
  }
}

</style>
