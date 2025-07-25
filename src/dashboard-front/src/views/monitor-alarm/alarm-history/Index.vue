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
  <div class="page-wrapper-padding alarm-history-container">
    <div class="header flex justify-between">
      <BkForm
        class="flex"
        :model="filterData"
      >
        <BkFormItem
          :label="t('选择时间')"
          class="ag-form-item-datepicker"
          label-width="85"
        >
          <BkDatePicker
            :key="dateKey"
            v-model="initDateTimeRange"
            class="w-320px"
            :placeholder="t('选择日期时间范围')"
            type="datetimerange"
            :shortcuts="datepickerShortcuts"
            shortcut-close
            use-shortcut-text
            :shortcut-selected-index="shortcutSelectedIndex"
            @clear="handleTimeClear"
            @shortcut-change="handleShortcutChange"
            @pick-success="handleTimeChange"
          />
        </BkFormItem>
        <BkFormItem
          :label="t('告警策略')"
          property="alarm_strategy_id"
          class="m-b-10px"
          label-width="108"
        >
          <BkSelect
            v-model="filterData.alarm_strategy_id"
            filterable
            :input-search="false"
            :scroll-loading="scrollLoading"
            @scroll-end="handleScrollEnd"
            @toggle="handleToggle"
          >
            <BkOption
              v-for="option in alarmStrategyOption"
              :key="option.id"
              :value="option.value"
              :label="option.label"
            />
          </BkSelect>
        </BkFormItem>
        <BkFormItem
          :label="t('告警状态')"
          property="status"
          class="m-b-10px"
          label-width="119"
        >
          <BkSelect v-model="filterData.status">
            <BkOption
              v-for="option in alarmStatus"
              :key="option.value"
              :value="option.value"
              :label="option.name"
            />
          </BkSelect>
        </BkFormItem>
      </BkForm>
    </div>
    <div class="alarm-history-content">
      <BkLoading :loading="isLoading">
        <BkTable
          class="alarm-history-table"
          :data="tableData"
          remote-pagination
          :pagination="pagination"
          :columns="tableColumns"
          :max-height="clientHeight"
          row-hover="auto"
          @page-limit-change="handlePageSizeChange"
          @page-value-change="handlePageChange"
          @row-click="handleRowClick"
        >
          <template #empty>
            <TableEmpty
              :empty-type="tableEmptyConfig.emptyType"
              :abnormal="tableEmptyConfig.isAbnormal"
              @refresh="getList"
              @clear-filter="handleClearFilterKey"
            />
          </template>
        </BkTable>
      </BkLoading>
    </div>

    <!-- 详情 -->
    <BkSideslider
      v-model:is-show="sliderConfig.isShow"
      ext-cls="alarm-history-slider"
      :width="750"
      :title="sliderConfig.title"
      quick-close
    >
      <template #default>
        <div class="history-form p-30px">
          <section class="ag-kv-list">
            <div class="item">
              <div class="key">
                {{ t("告警ID：") }}
              </div>
              <div class="value">
                {{ sliderConfig.data.id }}
              </div>
            </div>
            <div class="item">
              <div class="key">
                {{ t("告警时间：") }}
              </div>
              <div class="value">
                {{ sliderConfig.data.created_time }}
              </div>
            </div>
            <div class="item">
              <div class="key">
                {{ t("告警策略：") }}
              </div>
              <div class="value strategy-name-list">
                <p
                  v-for="(name, index) of sliderConfig.data.alarm_strategy_names"
                  :key="index"
                  class="name-item"
                >
                  <span
                    class="ag-label"
                    :title="name"
                  >
                    {{ name }}
                  </span>
                </p>
              </div>
            </div>
            <div class="item">
              <div class="key">
                {{ t("告警内容：") }}
              </div>
              <div class="value message">
                <pre>{{ sliderConfig.data.message || "--" }}</pre>
              </div>
            </div>
            <div class="item">
              <div class="key">
                {{ t("状态：") }}
              </div>
              <div class="value">
                <span
                  class="m-r-4px ag-outline-dot"
                  :class="[sliderConfig.data.status]"
                />
                <span class="status-text">
                  {{ getAlarmStatusText(sliderConfig.data.status) }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </BkSideslider>
  </div>
</template>

<script lang="tsx" setup>
import { cloneDeep } from 'lodash-es';
import { useAccessLog, useGateway } from '@/stores';
import { useMaxTableLimit, useQueryList } from '@/hooks';
import { type IAlarmRecord, getRecordList, getStrategyList } from '@/services/source/monitor';
import TableEmpty from '@/components/table-empty/Index.vue';

const { t } = useI18n();
const gatewayStore = useGateway();
const accessLogStore = useAccessLog();
const { maxTableLimit, clientHeight } = useMaxTableLimit();

const { datepickerShortcuts, alarmStatus } = accessLogStore;
const dateKey = ref('dateKey');
const curStrategyCount = ref(0);
const shortcutSelectedIndex = ref(-1);
const scrollLoading = ref(false);
const initDateTimeRange = ref([]);
const alarmStrategyOption = ref([]);
const tableColumns = ref([
  {
    label: t('告警ID'),
    field: 'id',
    width: 100,
  },
  {
    label: t('告警时间'),
    field: 'created_time',
    width: 260,
  },
  {
    label: t('告警策略'),
    field: 'alarm_strategy_names',
    width: 320,
    showOverflowTooltip: false,
    render: ({ row }: { row?: Partial<IAlarmRecord> }) => {
      if (row?.alarm_strategy_names?.length) {
        return (
          <div class="lh-1">
            <span
              v-bk-tooltips={{
                content: row.alarm_strategy_names?.join('; '),
                placement: 'top',
              }}
              class="strategy-names"
            >
              {
                row.alarm_strategy_names.map((strategy, index) => {
                  if (index < 4) {
                    return (
                      <span class="ag-label">
                        { strategy }
                      </span>
                    );
                  }
                  if (index === row.alarm_strategy_names.length - 1 && index > 3) {
                    return <span class="ag-label">...</span>;
                  }
                })
              }
            </span>
          </div>
        );
      }
      return '--';
    },
  },
  {
    label: t('告警内容'),
    field: 'message',
    render: ({ row }: { row?: Partial<IAlarmRecord> }) => {
      return (
        <span
          v-bk-tooltips={{
            content: row?.message || '',
            placement: 'left',
            extCls: 'monitor-tooltips',
          }}
        >
          { row?.message }
        </span>
      );
    },
  },
  {
    label: t('状态'),
    field: 'status',
    width: 200,
    render: ({ row }: { row?: Partial<IAlarmRecord> }) => {
      return (
        <span>
          <span class={['m-r-4px', 'ag-outline-dot', row?.status]} />
          <span
            v-bk-tooltips={{
              content: row?.comment || '--',
              disabled: !['skipped'].includes(row?.status),
            }}
            class="status-text"
          >
            { getAlarmStatusText(row?.status) }
          </span>
        </span>
      );
    },
  },
]);
const tableEmptyConfig = ref<{
  emptyType: string
  isAbnormal: boolean
}>({
  emptyType: '',
  isAbnormal: false,
});
const initParams = reactive({
  limit: 10,
  offset: 0,
  order_by: 'name',
});
const initFilterData = reactive({
  alarm_strategy_id: '',
  status: '',
  time_start: '',
  time_end: '',
});
let sliderConfig = reactive({
  isShow: false,
  title: t('告警详情'),
  data: {
    id: -1,
    created_time: '',
    alarm_strategy_names: [],
    message: '',
    status: '',
  },
});
const filterData = ref(cloneDeep(initFilterData));

// 列表hooks
const {
  tableData,
  pagination,
  isLoading,
  handlePageChange,
  handlePageSizeChange,
  getList,
} = useQueryList({
  apiMethod: getRecordList,
  filterData,
  initialPagination: {
    limitList: [maxTableLimit, 10, 20, 50, 100],
    limit: maxTableLimit,
  },
});

const apigwId = computed(() => gatewayStore.apigwId);

// 日期清除
const handleTimeClear = () => {
  shortcutSelectedIndex.value = -1;
  filterData.value = Object.assign(filterData.value, {
    time_start: '',
    time_end: '',
  });
};

// 日期快捷方式改变触发
const handleShortcutChange = (
  item: {
    text: string
    value: () => void
  },
  index: number,
) => {
  shortcutSelectedIndex.value = index;
};

// 日期快捷方式改变触发
const handleTimeChange = () => {
  const startStr = +new Date(`${initDateTimeRange.value[0]}`) / 1000;
  const endStr = +new Date(`${initDateTimeRange.value[1]}`) / 1000;
  const start = parseInt(startStr);
  const end = parseInt(endStr);
  filterData.value = Object.assign(filterData.value, {
    time_start: start,
    time_end: end,
  });
};

// 获取状态name
const getAlarmStatusText = (status: string) => {
  const curStatus = alarmStatus.find(item => item.value === status) ?? {};
  return curStatus.name ?? '--';
};
// 获取告警策略list
const getStrategyOption = async () => {
  const { results, count } = await getStrategyList(apigwId.value, initParams);
  curStrategyCount.value = count;
  alarmStrategyOption.value = results.map(item => ({
    label: item.name,
    value: item.id,
  }));
};
// 滚动获取告警策略
const handleScrollEnd = async () => {
  if (alarmStrategyOption.value.length === curStrategyCount.value) return;
  scrollLoading.value = true;
  initParams.offset += 10;
  try {
    const { results } = await getStrategyList(apigwId.value, initParams);
    const addData = results.map(item => ({
      label: item.name,
      value: item.id,
    }));
    alarmStrategyOption.value = alarmStrategyOption.value.concat(addData);
  }
  finally {
    scrollLoading.value = false;
  }
};

// 刷新表格
const fetchRefreshTable = async () => {
  await getList();
  updateTableEmptyConfig();
};

// 切换告警策略选项下拉折叠状态
const handleToggle = (value: boolean) => {
  if (value) {
    initParams.offset = 0;
    getStrategyOption();
  }
};

// 鼠标点击
const handleRowClick = (e: MouseEvent, row: IAlarmRecord) => {
  sliderConfig = Object.assign(sliderConfig, {
    isShow: true,
    data: row,
  });
};

const handleClearFilterKey = async () => {
  initDateTimeRange.value = [];
  shortcutSelectedIndex.value = -1;
  dateKey.value = String(+new Date());
  filterData.value = cloneDeep(initFilterData);
  await fetchRefreshTable();
};

const updateTableEmptyConfig = () => {
  const list = Object.values(filterData.value).filter(item => item !== '');
  tableEmptyConfig.value.isAbnormal = pagination.value.abnormal;
  if (list.length && !tableData.value.length) {
    tableEmptyConfig.value.emptyType = 'searchEmpty';
    return;
  }
  if (list.length) {
    tableEmptyConfig.value.emptyType = 'empty';
    return;
  }
  tableEmptyConfig.value.emptyType = '';
};

watch(
  () => tableData.value, () => {
    updateTableEmptyConfig();
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.w300 {
  width: 300px;
}

.w80 {
  width: 80px;
}

.w88 {
  width: 88px;
}

:deep(.alarm-history-table) {
  .bk-table-body {
    table {
      tbody {
        tr {
          cursor: pointer;

          td {
            .cell {
              height: auto !important;
              line-height: normal;
            }
          }
        }
      }
    }
  }
}

.ag-kv-list {
  border: 1px solid #f0f1f5;
  border-radius: 2px;
  background-color: #fafbfd;
  padding: 10px 20px;

  .item {
    display: flex;
    font-size: 14px;
    border-bottom: 1px dashed #dcdee5;
    min-height: 40px;
    line-height: 40px;

    &:last-child {
      border-bottom: none;
    }

    .key {
      min-width: 120px;
      padding-right: 24px;
      color: #63656e;
      text-align: right;
    }

    .value {
      color: #313238;
      flex: 1;

      pre {
        margin: 0;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
    .message {
      line-height: 22px;
      padding: 10px 0;
    }
  }
}

.strategy-name-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: 6px 0;

  .name-item {
    margin: 0 0 4px 0;
    line-height: 0;

    .ag-label {
      max-width: 300px;
    }
  }
}

.strategy-name-list,
:deep(.strategy-names) {
  .ag-label {
    height: 24px;
    line-height: 22px;
    border: 1px solid #dcdee5;
    text-align: center;
    padding: 0 10px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: normal;
    display: inline-block;
    margin-right: 4px;
    border-radius: 2px;
    white-space: nowrap;
  }
}

:deep(.ag-outline-dot) {
  width: 10px;
  height: 10px;
  border: 2px solid #c4c6cc;
  display: inline-block;
  border-radius: 50%;
  vertical-align: middle;
  line-height: 1;

  &.success {
    border-color: #34d97b;
  }

  &.failure,
  &.fail {
    border-color: #ea3536;
  }

  &.skipped,
  &.unknown {
    border-color: #979ba5;
  }

  &.received {
    border-color: #3a84ff;
  }
}
</style>

<style lang="scss">
.bk-popper.monitor-tooltips {
  width: 520px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
