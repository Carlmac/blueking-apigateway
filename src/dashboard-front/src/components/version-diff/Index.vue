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
  <div class="ag-version-diff-box">
    <p class="summary-data">
      <span class="font-bold color-#63656e">
        {{ t("对比结果") }}：
      </span>
      <template v-if="isDataLoading">
        <span>
          <Spinner fill="#3a84ff" />
          {{ t("正在努力对比中…") }}
        </span>
      </template>
      <template v-else-if="localSourceId || localTargetId">
        <span>
          {{ t("新增") }}
          <span class="font-bold color-#2dcb56 m-5px">
            {{ diffData.add.length }}
          </span>
          {{ t("个资源") }}，
        </span>
        <span>
          {{ t("更新") }}
          <span class="font-bold color-#ff9c01! m-5px">
            {{ diffData.update.length }}
          </span>
          {{ t("个资源") }}，
        </span>
        <span>
          {{ t("删除") }}
          <span class="font-bold color-#ea3636 m-5px">
            {{ diffData.delete.length }}
          </span>
          {{ t("个资源") }}
        </span>
      </template>
      <template v-else>
        --
      </template>
    </p>

    <div class="search-data mb-15px">
      <BkInput
        v-model="searchParams.keyword"
        clearable
        class="w-310px! float-left mr-10px"
        :placeholder="t('请输入资源名称、资源地址或请求路径，回车结束')"
        type="search"
        @enter="handleSearch"
        @clear="handleClear"
        @change="updateTableEmptyConfig"
      />
      <BkSelect
        v-model="searchParams.diffType"
        class="w-140px float-left mr-10px"
        clearable
        :placeholder="t('全部差异类型')"
        @change="updateTableEmptyConfig"
      >
        <BkOption
          v-for="option in diffTypeList"
          :id="option.id"
          :key="option.id"
          :name="option.name"
        />
      </BkSelect>
      <BkCheckbox
        v-model="searchParams.onlyUpdated"
        class="float-left mt-6px"
        true-value
        :false-value="false"
      >
        {{ t("仅显示有差异的资源属性") }}
      </BkCheckbox>

      <div class="tag-list">
        <div class="legend-group">
          <div class="tag success" />
          <div>{{ t("新增") }}</div>
        </div>
        <div class="legend-group">
          <div class="tag danger" />
          <div>{{ t("删除") }}</div>
        </div>
        <div class="legend-group">
          <div class="tag warning" />
          <div>{{ t("更新") }}</div>
        </div>
      </div>
    </div>

    <div
      class="diff-wrapper"
      :class="[{ 'no-result': !hasResult }]"
    >
      <div class="diff-header">
        <div class="source-header">
          <!-- <div class="marked">{{ t("源版本") }}</div> -->
          <div class="version">
            <template
              v-if="localSourceId && (localSourceId !== 'current' || localTargetId !== 'current')"
            >
              <BkSelect
                v-if="sourceSwitch || pageType === 'createVersion'"
                v-model="localSourceId"
                class="float-left mr-10px choose-version"
                :placeholder="t('请选择源版本')"
                :clearable="false"
                :input-search="false"
                filterable
                @change="handleVersionChange"
              >
                <template #trigger>
                  <span
                    v-bk-tooltips="{ content: localSourceTriggerLabel, delay: 300 }"
                    class="trigger-label"
                  >
                    {{ localSourceTriggerLabel }}
                  </span>
                  <AgIcon
                    name="down-shape"
                    class="trigger-label-icon"
                  />
                </template>
                <BkOption
                  v-for="option in localVersionList"
                  :id="option.id"
                  :key="option.id"
                  :disabled="option.id === localTargetId"
                  :name="option.resource_version_display"
                />
              </BkSelect>
              <span
                v-else
                class="title"
              >
                <template v-if="pageType === 'publishEnvironment'">
                  {{
                    sourceVersion.version ? t('当前版本（{version}）', { version: sourceVersion.version }) : t('暂无版本')
                  }}
                </template>
                <template v-else>
                  {{ sourceVersion.version }} {{ sourceVersion.comment ? `(${sourceVersion.comment})` : '' }}
                </template>
              </span>
            </template>
            <span
              v-else
              class="title"
            >
              {{ t('暂无版本') }}
            </span>
          </div>
        </div>
        <div class="target-header">
          <div class="version">
            <BkSelect
              v-if="targetSwitch && pageType !== 'createVersion'"
              v-model="localTargetId"
              class="float-left mr-10px w-320px choose-version"
              :placeholder="t('请选择目标版本')"
              :clearable="false"
              :input-search="false"
              filterable
              @change="handleVersionChange"
            >
              <template #trigger>
                <span class="trigger-label">
                  {{ localTargetTriggerLabel }}
                  <AgIcon
                    name="down-shape"
                    class="trigger-label-icon"
                  />
                </span>
              </template>
              <BkOption
                v-for="option in localVersionList"
                :id="option.id"
                :key="option.id"
                :disabled="option.id === localSourceId"
                :name="option.resource_version_display"
              />
            </BkSelect>
            <span
              v-else
              class="title"
            >
              <template v-if="pageType !== 'createVersion'">
                <template v-if="pageType === 'publishEnvironment'">
                  {{ t('待发布（{version}）', { version: targetVersion.version }) }}
                </template>
                <template v-else>
                  {{ targetVersion.version }} {{ targetVersion.comment ? `(${targetVersion.comment})` : '' }}
                </template>
              </template>
              <template v-else>
                {{ t('当前最新资源列表') }}
              </template>
            </span>
          </div>
          <!-- <div class="marked">{{ t("目标版本") }}</div> -->
        </div>
        <button
          v-if="targetSwitch && sourceSwitch && localSourceId"
          class="switch-btn"
          @click="handleSwitch"
        >
          <AgIcon name="exchange-line" />
        </button>
      </div>

      <div class="diff-main">
        <BkLoading
          :loading="isDataLoading"
          color="#ffffff"
          :opacity="1"
          :z-index="1000"
          class="diff-loading"
        >
          <!-- 新增 -->
          <div
            v-for="addItem in diffData.add"
            :key="addItem.id"
            class="diff-item"
          >
            <template v-if="checkMatch(addItem, 'add')">
              <div class="source-box">
                <div
                  class="metadata pl-10px"
                  @click="() => handleToggle(addItem)"
                >
                  <AgIcon
                    v-if="!addItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span class="resource-title">--</span>
                </div>
                <div class="resource-box">
                  <BkException
                    v-show="addItem.isExpanded"
                    class="exception-part"
                    type="empty"
                    scene="part"
                  >
                    {{ t("此版本无该资源") }}
                  </BkException>
                </div>
              </div>
              <div class="target-box">
                <div
                  class="metadata color-#2dcb56"
                  @click="() => handleToggle(addItem)"
                >
                  <AgIcon
                    v-if="!addItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span
                    v-dompurify-html="renderTitle(addItem)"
                    class="resource-title"
                    :title="`【${addItem?.method}】${addItem?.path}`"
                  />
                </div>
                <div class="resource-box">
                  <ResourceDetail
                    v-show="addItem.isExpanded"
                    :cur-resource="addItem"
                    :backends-list="backendsList"
                  />
                </div>
              </div>
            </template>
          </div>

          <!-- 删除 -->
          <div
            v-for="deleteItem in diffData.delete"
            :key="deleteItem.id"
            class="diff-item"
          >
            <template v-if="checkMatch(deleteItem, 'delete')">
              <div class="source-box">
                <div
                  class="metadata"
                  @click="() => handleToggle(deleteItem)"
                >
                  <AgIcon
                    v-if="!deleteItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span
                    v-dompurify-html="renderTitle(deleteItem)"
                    class="resource-title"
                    :title="`【${deleteItem?.method}】${deleteItem?.path}`"
                  />
                </div>
                <div class="resource-box">
                  <!-- <bk-transition :name="animation"> -->
                  <ResourceDetail
                    v-show="deleteItem.isExpanded"
                    :cur-resource="deleteItem"
                    :backends-list="backendsList"
                  />
                  <!-- </bk-transition> -->
                </div>
              </div>
              <div class="target-box">
                <div
                  class="metadata color-#ea3636"
                  @click="() => handleToggle(deleteItem)"
                >
                  <AgIcon
                    v-if="!deleteItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span
                    v-dompurify-html="renderTitle(deleteItem)"
                    class="resource-title"
                    :title="`【${deleteItem?.method}】${deleteItem?.path}`"
                  />
                </div>
                <div class="resource-box">
                  <ResourceDetail
                    v-show="deleteItem.isExpanded"
                    style="opacity: 35%"
                    :cur-resource="deleteItem"
                    :backends-list="backendsList"
                  />
                </div>
              </div>
            </template>
          </div>

          <!-- 更新 -->
          <div
            v-for="updateItem in diffData.update"
            :key="`${updateItem.source.id}:${updateItem.target.id}`"
            class="diff-item"
          >
            <template v-if="checkMatch(updateItem.source, 'update') || checkMatch(updateItem.target, 'update')">
              <div class="source-box">
                <div
                  class="metadata"
                  @click="() => handleToggle(updateItem)"
                >
                  <AgIcon
                    v-if="!updateItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span
                    v-dompurify-html="renderTitle(updateItem.source)"
                    class="resource-title"
                    :title="`【${updateItem?.source?.method}】${updateItem?.source?.path}`"
                  />
                </div>
                <div class="resource-box">
                  <ResourceDetail
                    v-show="updateItem.isExpanded"
                    class="source-version"
                    :cur-resource="updateItem.source"
                    :backends-list="backendsList"
                    :diff-data="updateItem.target.diff"
                    :only-show-diff="searchParams.onlyUpdated"
                    is-source
                  />
                </div>
              </div>
              <div class="target-box">
                <div
                  class="metadata color-#ff9c01!"
                  @click="() => handleToggle(updateItem)"
                >
                  <AgIcon
                    v-if="!updateItem.isExpanded"
                    name="right-shape"
                    class="expand-icon"
                  />
                  <AgIcon
                    v-else
                    name="down-shape"
                    class="expand-icon"
                  />
                  <span
                    v-dompurify-html="renderTitle(updateItem.target)"
                    class="resource-title"
                    :title="`【${updateItem?.target?.method}】${updateItem?.target?.path}`"
                  />
                </div>

                <div class="resource-box">
                  <ResourceDetail
                    v-show="updateItem.isExpanded"
                    :cur-resource="updateItem.target"
                    :backends-list="backendsList"
                    :diff-data="updateItem.source.diff"
                    :only-show-diff="searchParams.onlyUpdated"
                  />
                </div>
              </div>
            </template>
          </div>

          <template v-if="!hasResult && !isDataLoading">
            <!-- 无数据 -->
            <TableEmpty
              v-if="hasFilter"
              :abnormal="tableEmptyConf.isAbnormal"
              @refresh="getDiffData"
              @clear-filter="handleClearFilterKey"
            />
            <BkException
              v-else
              class="mt-50px diff-tips"
              type="search-empty"
              scene="part"
            >
              {{
                !localTargetId
                  ? t("请选择目标版本")
                  : t("版本资源配置无差异")
              }}
            </BkException>
          </template>
        </BkLoading>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ResourceDetail from '@/components/resource-detail/Index.vue';
import { Spinner } from 'bkui-vue/lib/icon';
import TableEmpty from '@/components/table-empty/Index.vue';
import { getGatewayLabels } from '@/services/source/gateway';
import {
  type IDiffData,
  type IVersionItem,
  getVersionDiff,
  getVersionList,
} from '@/services/source/resource';
import { getBackendServiceList } from '@/services/source/backendServices';
import { useGateway } from '@/stores';

interface IProps {
  versionList?: IVersionItem[]
  sourceId?: string
  targetId?: string
  sourceSwitch?: boolean
  targetSwitch?: boolean
  curDiffEnabled?: boolean
  // createVersion: 生成资源版本  publishEnvironment: 发布到环境
  pageType?: string
}

interface ILocalVersionItem extends IVersionItem {
  name?: string
  resource_version_display?: string
  stage_text?: string
}

const {
  versionList = [],
  sourceId = '',
  targetId = '',
  sourceSwitch = true,
  targetSwitch = true,
  curDiffEnabled = true,
  pageType = '',
} = defineProps<IProps>();

const { t } = useI18n();
const route = useRoute();
const gatewayStore = useGateway();

// 网关id
const apigwId = computed(() => +route.params.id);
const tableEmptyConf = ref<{
  keyword: string
  isAbnormal: boolean
}>({
  keyword: '',
  isAbnormal: false,
});

const width = ref(1240);
const isDataLoading = ref(false);
const localSourceId = ref(sourceId);
const localTargetId = ref(targetId || 'current');
const localVersionList = ref<Partial<ILocalVersionItem>[]>(versionList);
const diffData = reactive<IDiffData>({
  add: [],
  delete: [],
  update: [],
});
const searchKeyword = ref('');
const searchParams = reactive({
  keyword: '',
  diffType: '',
  onlyUpdated: false,
});
const diffTypeList = reactive([
  {
    id: 'add',
    name: t('新增'),
  },
  {
    id: 'delete',
    name: t('删除'),
  },
  {
    id: 'update',
    name: t('更新'),
  },
]);

const backendsList = ref([]);

const hasResult = computed(() => {
  const addItem = diffData.add.some((item) => {
    return checkMatch(item, 'add');
  });

  const deleteItem = diffData.delete.some((item) => {
    return checkMatch(item, 'delete');
  });

  const updateItem = diffData.update.some((item) => {
    return (
      checkMatch(item.source, 'update') || checkMatch(item.target, 'update')
    );
  });

  return addItem || deleteItem || updateItem || isDataLoading.value;
});

const hasFilter = computed(() => searchKeyword.value || searchParams.diffType);

const sourceVersion = computed(() => {
  const match = localVersionList.value.find(item => item.id === localSourceId.value);
  if (match) {
    return match;
  }
  return {
    id: '',
    comment: '',
    version: '',
  };
});

const targetVersion = computed(() => {
  const match = localVersionList.value.find(item => item.id === localTargetId.value);
  if (match) {
    return match;
  }
  return {
    id: '',
    comment: '',
    version: '',
  };
});

const localSourceTriggerLabel = computed(() => {
  const match = localVersionList.value.find(item => Number(item.id) === Number(localSourceId.value));
  if (match) {
    return match.resource_version_display;
  }
  return t('当前最新资源列表');
});

const localTargetTriggerLabel = computed(() => {
  const match = localVersionList.value.find(item => Number(item.id) === Number(localTargetId.value));
  if (match) {
    return match.resource_version_display;
  }
  return t('当前最新资源列表');
});

watch(
  () => [sourceId, targetId],
  async (newArr) => {
    const [sourceId, targetId] = newArr;
    localSourceId.value = sourceId;
    localTargetId.value = targetId || 'current';
    isDataLoading.value = false;
    await getDiffData();
  },
);

width.value = window.innerWidth <= 1280 ? 1000 : 1240;

const handleToggle = (item: IDiffData['add'][number] | IDiffData['update'][number] | IDiffData['delete'][number]) => {
  item.isExpanded = !item.isExpanded;
};

const handleSearch = (keyword?: string) => {
  searchKeyword.value = keyword || '';
};

const handleClear = () => {
  searchKeyword.value = '';
};

const handleSwitch = async () => {
  [localSourceId.value, localTargetId.value] = [
    localTargetId.value,
    localSourceId.value,
  ];
  await getDiffData();
};

const checkMatch = (item: any, type: any) => {
  if (searchParams.diffType && searchParams.diffType !== type) {
    return false;
  }
  const method = item?.method?.toLowerCase();
  const path = item?.path?.toLowerCase();
  const backendPath = item?.proxy?.config?.path?.toLowerCase();
  const name = item?.name?.toLowerCase();
  const keyword = searchKeyword.value.toLowerCase();
  return (
    method.indexOf(keyword) > -1
    || path.indexOf(keyword) > -1
    || backendPath.indexOf(keyword) > -1
    || name.indexOf(keyword) > -1
  );
};

const renderTitle = (item: any) => {
  let { method, path } = item;
  if (searchKeyword.value) {
    const reg = new RegExp(`(${searchKeyword.value})`, 'ig');
    method = method.replace(reg, '<i class="keyword font-bold color-#3a84ff">$1</i>');
    path = path.replace(reg, '<i class="keyword font-bold color-#3a84ff">$1</i>');
  }

  // return `【${method}】${path}`;

  // POST = 'info', GET = 'success', DELETE = 'danger', PUT = 'warning', PATCH = 'info', ANY = 'success',
  let tagCls = 'bk-tag-info';
  switch (method) {
    case 'POST':
      tagCls = 'bk-tag-info';
      break;
    case 'GET':
      tagCls = 'bk-tag-success';
      break;
    case 'DELETE':
      tagCls = 'bk-tag-danger';
      break;
    case 'PUT':
      tagCls = 'bk-tag-warning';
      break;
    case 'PATCH':
      tagCls = 'bk-tag-info';
      break;
    case 'ANY':
      tagCls = 'bk-tag-success';
      break;
    default:
      break;
  }
  return `<div class="bk-tag ${tagCls} bk-tag--default" style="border-radius: 2px;margin-right: 4px;">`
    + `<span class="bk-tag-text">${method}</span>`
    + `</div><span class="title-content">${path}</span>`;
};

const updateTableEmptyConfig = () => {
  const isSearch = !!searchParams.keyword || !!searchParams.diffType;
  if (isSearch && !hasResult.value) {
    tableEmptyConf.value.keyword = 'placeholder';
    return;
  }
  if (isSearch) {
    tableEmptyConf.value.keyword = '$CONSTANT';
    return;
  }
  tableEmptyConf.value.keyword = '';
};

const handleClearFilterKey = async () => {
  searchParams.keyword = '';
  searchParams.diffType = '';
  searchKeyword.value = '';
  await getDiffData();
  updateTableEmptyConfig();
};

const handleVersionChange = async () => {
  searchParams.keyword = '';
  searchParams.diffType = '';
  searchParams.onlyUpdated = false;
  searchKeyword.value = '';
  await getDiffData();
};

const getDiffData = async () => {
  if (isDataLoading.value || !localSourceId.value) {
    return false;
  }

  isDataLoading.value = true;

  diffData.add = [];
  diffData.delete = [];
  diffData.update = [];

  try {
    const res = await getVersionDiff(apigwId.value, {
      source_resource_version_id: String(localSourceId.value).replace(
        'current',
        '',
      ),
      target_resource_version_id: String(localTargetId.value).replace(
        'current',
        '',
      ),
    });

    res.add.forEach((item: any) => {
      item.isExpanded = false;
    });
    res.delete.forEach((item: any) => {
      item.isExpanded = false;
    });
    res.update.forEach((item: any) => {
      item.isExpanded = false;

      if (item?.source?.diff?.proxy?.backend_id) {
        const curBackend: any = backendsList.value?.find((backend: any) => {
          return backend.id === item.source.diff.proxy.backend_id;
        });
        item.source.diff.proxy.backend_name = curBackend?.name || '';
      }

      if (item?.target?.diff?.proxy?.backend_id) {
        const curBackend: any = backendsList.value?.find((backend: any) => {
          return backend.id === item.target.diff.proxy.backend_id;
        });
        item.target.diff.proxy.backend_name = curBackend?.name || '';
      }
    });

    diffData.add = res.add;
    diffData.delete = res.delete;
    diffData.update = res.update;
  }
  finally {
    setTimeout(() => {
      isDataLoading.value = false;
    }, 1000);
  }
};

const getApigwVersions = async () => {
  const response = await getVersionList(apigwId.value, {
    limit: 1000,
    offset: 0,
  });

  if (curDiffEnabled) {
    localVersionList.value = [
      {
        id: 'current',
        name: t('当前最新资源列表'),
        resource_version_display: t('当前最新资源列表'),
      },
      ...response.results.map(item => ({
        ...item,
        resource_version_display: item.comment ? `${item.version}(${item.comment})` : item.version,
        stage_text: item.released_stages.map((item) => {
          return item.name;
        }),
      })),
    ];
  }
  else {
    localVersionList.value = response.results;
  }
};

const getLabels = async () => {
  const res = await getGatewayLabels(apigwId.value);
  gatewayStore.setGatewayLabels(res);
};

// 后端服务列表
const getBackendsList = async () => {
  const res = await getBackendServiceList(apigwId.value);
  backendsList.value = res.results || [];
};

const init = async () => {
  await Promise.all([
    getDiffData(),
    getApigwVersions(),
    getLabels(),
    getBackendsList(),
  ]);
};

onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.summary-data {
  height: 40px;
  padding: 0 16px;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 40px;
  color: #63656e;
  background-color: #f5f7fa;
}

.search-data {

  &::after {
    display: table;
    clear: both;
    content: "";
  }
}

.tag-list {
  display: flex;
  float: right;
  height: 32px;
  line-height: 32px;
  align-items: center;

  .legend-group {
    display: flex;
    align-items: center;
    margin-left: 10px;
    font-size: 13px;
    color: #63656e;

    .tag {
      width: 10px;
      height: 10px;
      margin-right: 5px;

      &.success {
        background: #dcffe2;
        border: 1px solid #94f5a4;
      }

      &.danger {
        background: #ffe9e8;
        border: 1px solid #ffbdbd;
      }

      &.warning {
        background: #ffefd6;
        border: 1px solid #ffe3b5;
      }
    }
  }
}

.diff-wrapper {
  position: relative;
  min-height: 300px;
  border: 1px solid #dcdee5;
  border-radius: 2px;

  &.no-result {

    &::after {
      display: none;
    }
  }

  &::after {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 100;
    display: inline-block;
    width: 1px;
    height: 100%;
    margin-left: -1px;
    background: #dbdee4;
    content: "";
  }
}

.diff-main {
  max-height: calc(100vh - 362px);
  min-height: 300px;
  overflow: hidden auto;

  .diff-loading {
    min-height: 300px;
    padding: 6px 0;
  }
}

.diff-item {
  display: flex;

  .source-box,
  .target-box {
    width: 50%;
    padding: 6px 12px;

    .metadata {
      position: relative;
      height: 36px;
      padding-left: 10px;

      // border: 1px solid #f0f1f5;
      font-size: 12px;
      font-weight: bold;
      line-height: 36px;
      color: #63656e;
      cursor: pointer;
      background: #f0f1f5;
      border-radius: 2px;

      .expand-icon {
        position: absolute;
        top: 12px;
        z-index: 1;
        color: #979ba5;
      }

      .resource-title {
        position: relative;
        display: inline-block;
        width: 96%;
        max-width: 550px;
        margin-left: 18px;
        overflow: hidden;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;

        :deep(.bk-tag-text) {
          font-weight: 400;
        }
      }

      // .bk-icon {
      //   display: inline-block;
      //   transform-origin: center;
      //   transition: all ease 0.3s;

      //   &.active {
      //     transform: rotate(90deg);
      //   }
      // }

      &.danger {
        background: #fef2f2;

        // border-color: #fe9c9c;

        .resource-title {
          color: #ea3636;

          :deep(.title-content) {
            text-decoration: line-through;
          }
        }
      }

      &.success {
        background: #f0fcf4;

        // border-color: #94f5a4;

        .resource-title {
          color: #2dcb56;
        }
      }

      &.warning {
        background: #fff9ef;

        // border-color: #ffd694;

        .resource-title {
          color: #ff9c01;
        }
      }
    }
  }

  .resource-box {
    position: relative;
    height: calc(100% - 36px);
    padding-inline: 15px;

    .exception-part {
      position: absolute;
      top: calc(50% - 40px);
      left: 0;
      transform: translateY(-50%);
    }
  }

  .delete-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    width: 68px;
    height: 68px;
  }
}

.diff-header {
  position: relative;
  display: flex;

  .switch-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 110;
    width: 27px;
    height: 27px;
    color: #63656e;
    background: #fff;
    border: none;
    border-radius: 50%;
    transform: translateY(-50%) translateX(-50%);
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 10%);

    &:hover {
      color: #3a84ff;
    }

    i {
      display: inline-block;
      margin-top: -4px;
      vertical-align: middle;
    }
  }

  .source-header,
  .target-header {
    display: flex;
    width: 50%;
    height: 42px;
    line-height: 42px;
    background-color: #f0f1f5;

    .choose-version {
      width: 320px;
      cursor: pointer;

      :deep(.bk-select-trigger) {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .trigger-label {
        position: relative;
        display: inline-block;
        max-width: 180px;
        margin-right: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // .trigger-label-icon {
      //   position: absolute;
      //   top: 15px;
      //   right: 0;
      // }
    }

    .marked {
      width: 130px;
      font-size: 13px;
      color: #63656e;
      text-align: center;
    }

    .version {
      position: relative;
      text-align: center;
      flex: 1;
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      color: #63656e;
      text-align: center;
      flex: 1;
    }
  }

  .source-header {
    background-color: #f5f7fa;
    border-right: 1px solid #dcdee5;
    border-bottom: 1px solid #dcdee5;

    .marked {
      border-right: 1px solid #dcdee5;
    }
  }

  .target-header {
    background-color: #f0f1f5;

    // border-left: 1px solid #dcdee5;
    border-bottom: 1px solid #dcdee5;

    .marked {
      border-left: 1px solid #dcdee5;
    }
  }
}
</style>

<style lang="scss">
.version {

  .bk-select {
    position: absolute;
    left: 50%;
    font-size: 13px;
    font-weight: 700;
    color: #63656e;
    border: none;
    transform: translateX(-50%);

    &.is-default-trigger.is-unselected::before {
      width: 280px;
      font-size: 13px;
      font-weight: 700;
      color: #63656e;
      text-align: center;
    }

    .bk-input {
      border: none;
    }

    .bk-input--text {
      background: transparent;
    }

    .bk-input--text::placeholder {
      font-size: 13px;
      font-weight: 700;
      color: #63656e;
      text-align: center;
    }

    &.is-focus .bk-input--default {
      box-shadow: none;
    }
  }
}

.diff-tips {
  color: #63656E;
}
</style>
