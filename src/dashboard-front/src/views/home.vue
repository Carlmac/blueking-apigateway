<template>
  <div class="home-container">
    <div class="title-container flex-row justify-content-between">
      <!-- <div class="flex-1 left">{{ t('我的网关') }} ({{ gatewaysList.length }})</div> -->
      <div class="flex-1 left">
        <bk-button
          theme="primary"
          class="mr4"
          @click="showAddDialog"
        >
          {{ t('新建网关') }}
        </bk-button>

        <!-- <bk-radio-group
          v-model="tabActive"
          type="capsule"
        >
          <bk-radio-button label="all">{{ t('全部 ({count})', { count: 20 }) }}</bk-radio-button>
          <bk-radio-button label="created">{{ t('我创建的 ({count})', { count: 40 }) }}</bk-radio-button>
        </bk-radio-group> -->
      </div>


      <div class="flex-1 flex-row">
        <bk-select
          class="gateway-kind-sel"
          v-model="filterNameData.kind"
          :clearable="false"
          :filterable="false"
        >
          <bk-option
            v-for="item in gatewayTypes"
            :key="item.value"
            :id="item.value"
            :name="item.label"
          />
        </bk-select>
        <bk-input class="ml8 mr8 flex-1 search-input" v-model="filterNameData.keyword" :placeholder="t('请输入网关名称')" />
        <bk-select
          v-model="filterKey"
          :clearable="false"
          class="select-cls"
          @change="handleChange"
        >
          <template #prefix>
            <div class="prefix-cls flex-row align-items-center">
              <i class="icon apigateway-icon icon-ag-exchange-line pb5" />
            </div>
          </template>
          <bk-option
            v-for="(item, index) in filterData"
            :key="index" :value="item.value" :label="item.label" />
        </bk-select>
      </div>
    </div>
    <div class="table-container" v-bkloading="{ loading: isLoading, opacity: 1, color: '#f5f7fb' }">
      <section v-if="gatewaysList.length">
        <div class="table-header flex-row">
          <div class="flex-1 of3">{{ t('网关名') }}</div>
          <div class="flex-1 of1">{{ t('创建者') }}</div>
          <div class="flex-1 of3">{{ t('环境列表') }}</div>
          <div class="flex-1 of1 text-c">{{ t('资源数量') }}</div>
          <div class="flex-1 of2">{{ t('操作') }}</div>
        </div>
        <div class="table-list">
          <div
            class="table-item flex-row align-items-center"
            v-for="item in gatewaysList" :key="item.id"
            :class="item.is24HoursAgo ? '' : 'newly-item'">
            <div class="flex-1 flex-row align-items-center  of3">
              <div
                :class="item.status ? '' : 'deact'"
                class="name-logo mr10"
                @click="handleGoPage('apigwResource', item)"
              >
                <span
                  :class="['kind', item.kind === 0 ? 'normal' : 'program']"
                  v-bk-tooltips="{ content: item.kind === 0 ? t('普通网关') : t('可编程网关') }">
                  {{ item.kind === 0 ? t('普') : t('编') }}
                </span>
                {{ item.name[0].toUpperCase() }}
              </div>
              <span
                :class="item.status ? '' : 'deact-name'"
                class="name mr10"
                @click="handleGoPage('apigwResource', item)"
              >
                {{ item.name }}
              </span>
              <bk-tag theme="info" v-if="item.is_official">{{ t('官方') }}</bk-tag>
              <bk-tag v-if="item.status === 0">{{ t('已停用') }}</bk-tag>
            </div>
            <div class="flex-1 of1">{{ item.created_by }}</div>
            <div class="flex-1 of3 env">
              <div class="flex-row">
                <span
                  v-for="(envItem, index) in item.stages" :key="envItem.id">
                  <bk-tag v-if="index < 3" class="environment-tag">
                    <i :class="['ag-dot',{ 'success': envItem.released }]"></i>
                    {{ envItem.name }}
                  </bk-tag>
                </span>
                <bk-tag
                  v-if="item.stages.length > item.tagOrder"
                  class="tag-cls"
                  v-bk-tooltips="{ content: tipsContent(item?.labelTextData), theme: 'light', placement: 'bottom' }">
                  +{{ item.stages.length - item.tagOrder }}
                  <!-- ... -->
                </bk-tag>
              </div>
            </div>
            <div
              :class="[
                'flex-1 of1 text-c',
                { 'default-c': item.hasOwnProperty('resource_count') }
              ]"
            >
              <template v-if="item.kind === 0">
                <!-- {{ item.resource_count }} -->
                <router-link :to="{ name: 'apigwResource', params: { id: item.id } }" target="_blank">
                  <span :style="{ color: item.resource_count === 0 ? '#c4c6cc' : '#3a84ff' }">
                    {{ item.resource_count }}
                  </span>
                </router-link>
              </template>
              <template v-else>
                <span class="none">--</span>
              </template>
            </div>
            <div class="flex-1 of2">
              <bk-button
                text theme="primary"
                @click="handleGoPage('apigwStageOverview', item)"
              >{{ $t('环境概览') }}
              </bk-button>
              <bk-button
                text
                theme="primary"
                class="pl20"
                :disabled="item?.kind === 1"
                @click="handleGoPage('apigwResource', item)"
              >{{ $t('资源配置') }}
              </bk-button>
              <bk-button
                text
                theme="primary"
                class="pl20"
                @click="handleGoPage('apigwAccessLog', item)"
              >{{ $t('流水日志') }}
              </bk-button>
            </div>
          </div>
        </div>
      </section>
      <div class="empty-container" v-else>
        <div class="table-header flex-row">
          <div class="flex-1 of3">{{ t('网关名') }}</div>
          <div class="flex-1 of1">{{ t('创建者') }}</div>
          <div class="flex-1 of3">{{ t('环境列表') }}</div>
          <div class="flex-1 of1 text-c">{{ t('资源数量') }}</div>
          <div class="flex-1 of2">{{ t('操作') }}</div>
        </div>
        <TableEmpty
          :keyword="tableEmptyConf.keyword"
          :abnormal="tableEmptyConf.isAbnormal"
          @reacquire="getGatewaysListData"
          @clear-filter="handleClearFilterKey"
        />
      </div>
    </div>
    <div class="footer-container">
      <!-- <div>
        <bk-link theme="primary" :href="GLOBAL_CONFIG.FOOT_INFO.NAMEHREF" target="_blank">
          {{ $t(GLOBAL_CONFIG.FOOT_INFO.NAME) }}
        </bk-link>
        <span>|</span>
        <bk-link theme="primary" :href="GLOBAL_CONFIG.FOOT_INFO.COMMUNITYHREF" target="_blank">
          {{ $t(GLOBAL_CONFIG.FOOT_INFO.COMMUNITY) }}
        </bk-link>
        <span v-if="GLOBAL_CONFIG.FOOT_INFO.PRODUCT">|</span>
        <bk-link
          v-if="GLOBAL_CONFIG.FOOT_INFO.PRODUCT"
          theme="primary"
          :href="GLOBAL_CONFIG.FOOT_INFO.PRODUCTHREF" target="_blank">
          {{ $t(GLOBAL_CONFIG.FOOT_INFO.PRODUCT) }}
        </bk-link>
      </div>
      Copyright © 2012-{{curYear}} Tencent BlueKing. All Rights Reserved. V{{GLOBAL_CONFIG.FOOT_INFO.VERSION}} -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="contact" v-dompurify-html="contact"></p>
      <p class="copyright">{{copyright}}</p>
    </div>

    <bk-dialog
      :is-show="dialogData.isShow"
      width="600"
      :title="dialogData.title"
      theme="primary"
      :quick-close="false"
      :is-loading="dialogData.loading"
      @confirm="handleConfirmCreate"
      @closed="dialogData.isShow = false">
      <bk-form ref="formRef" form-type="vertical" class="create-gw-form" :model="formData" :rules="rules">
        <bk-form-item
          class="form-item-name"
          :label="t('名称')"
          property="name"
          required
        >
          <bk-input
            v-model="formData.name"
            :maxlength="30"
            show-word-limit
            :placeholder="$t('请输入小写字母、数字、连字符(-)，以小写字母开头')"
            clearable
            autofocus
          />
        </bk-form-item>
        <span class="common-form-tips form-item-name-tips">
          {{ t('网关的唯一标识，创建后不可更改') }}
        </span>
        <bk-form-item
          :label="t('维护人员')"
          property="maintainers"
          required
        >
          <member-select v-model="formData.maintainers" />
        </bk-form-item>
        <bk-form-item
          :label="t('描述')"
          property="description"
        >
          <bk-input
            type="textarea"
            v-model="formData.description"
            :placeholder="t('请输入网关描述')"
            :maxlength="500"
            clearable
          />
        </bk-form-item>
        <bk-form-item
          :label="t('是否公开')"
          property="is_public"
          required
        >
          <bk-switcher theme="primary" v-model="formData.is_public" />
          <span class="common-form-tips">{{ $t('公开，则用户可查看资源文档、申请资源权限；不公开，则网关对用户隐藏') }}</span>
        </bk-form-item>
      </bk-form>
    </bk-dialog>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { createGateway } from '@/http';
import { useUser } from '@/store/user';
import { Message } from 'bkui-vue';
import { IDialog } from '@/types';
import { useRouter } from 'vue-router';
import { useGetApiList } from '@/hooks';
import { is24HoursAgo } from '@/common/util';
import { useCommon } from '@/store';
import MemberSelect from '@/components/member-select';
// @ts-ignore
import TableEmpty from '@/components/table-empty.vue';
import {
  computed,
  h,
  ref,
  watch,
} from 'vue';
import { GatewayListItem } from '@/types/gateway';

const { t } = useI18n();
const user = useUser();
const router = useRouter();
const common = useCommon();

// const tabActive = ref<string>('all');
const formRef = ref(null);
const filterKey = ref<string>('updated_time');
const filterNameData = ref({ keyword: '', kind: 'all' });
// 弹窗
const dialogData = ref<IDialog>({
  isShow: false,
  title: t('新建网关'),
  loading: false,
});
const gatewayTypes = ref([
  {
    label: t('全部'),
    value: 'all',
  },
  {
    label: t('普通网关'),
    value: '0',
  },
  {
    label: t('可编程网关'),
    value: '1',
  },
]);


// 新增网关弹窗字段interface
interface IinitDialogData {
  name: string
  maintainers: string[]
  description?: string
  is_public: boolean
}

// const globalProperties = useGetGlobalProperties();
// const { GLOBAL_CONFIG } = globalProperties;

// dialog弹窗数据
const initDialogData: IinitDialogData = {
  name: '',
  maintainers: [user.user.username],   // 默认当前填入当前用户
  description: '',
  is_public: true,
};

const tableEmptyConf = ref<{keyword: string, isAbnormal: boolean}>({
  keyword: '',
  isAbnormal: false,
});

const isLoading = ref(true);

const rules = {
  name: [
    {
      required: true,
      message: t('请填写名称'),
      trigger: 'change',
    },
    {
      validator: (value: string) => value.length >= 3,
      message: t('不能小于3个字符'),
      trigger: 'change',
    },
    {
      validator: (value: string) => value.length <= 30,
      message: t('不能多于30个字符'),
      trigger: 'change',
    },
    {
      validator: (value: string) => {
        const reg = /^[a-z][a-z0-9-]*$/;
        return reg.test(value);
      },
      message: t('由小写字母、数字、连接符（-）组成，首字符必须是小写字母，长度大于3小于30个字符'),
      trigger: 'change',
    },
  ],
};

// 新增网关字段
const formData = ref<IinitDialogData>(initDialogData);

// 网关列表数据
const gatewaysList = ref<any>([]);

// // 当前年份
// const curYear = (new Date()).getFullYear();

const filterData = ref([
  { value: 'updated_time', label: t('更新时间') },
  { value: 'created_time', label: t('创建时间') },
  { value: 'name', label: t('字母 A-Z') },
]);

// 获取网关数据方法
const {
  getGatewaysListData,
  dataList,
  pagination,
} = useGetApiList(filterNameData);

const contact = computed(() => {
  return (common?.websiteConfig as any)?.i18n?.footerInfoHTML;
});

const copyright = computed(() => {
  return (common?.websiteConfig as any)?.footerCopyrightContent;
});

// 处理列表项
const handleGatewaysList = (arr: any) => {
  if (!arr) return [];

  arr?.forEach((item: any) => {
    item.is24HoursAgo = is24HoursAgo(item.created_time);
    item.tagOrder = '3';
    item.stages?.sort((a: any, b: any) => (b.released - a.released));
    item.labelTextData = item.stages.reduce((prev: any, label: any, index: number) => {
      if (index > item.tagOrder - 1) {
        prev.push({ name: label.name, released: label.released });
      }
      return prev;
    }, []);
  });

  return arr;
};

// 赋值给列表
watch(() => dataList.value, (val: any[]) => {
  gatewaysList.value = handleGatewaysList(val);
});


// 页面初始化
const init = async () => {
  isLoading.value = true;
  const list = await getGatewaysListData();
  gatewaysList.value = handleGatewaysList(list);
  setTimeout(() => {
    isLoading.value = false;
  }, 100);
};
init();

// 新建网关弹窗
const showAddDialog = () => {
  // 初始化数据
  resetDialogData();
  formData.value = initDialogData;
  dialogData.value.isShow = true;
  dialogData.value.loading = false;
};

// 创建网关确认
const handleConfirmCreate = async () => {
  try {
    // 校验
    await formRef.value.validate();
    dialogData.value.loading = true;
    await createGateway(formData.value);
    Message({
      message: t('创建成功'),
      theme: 'success',
    });
    dialogData.value.isShow = false;
    init();
  } catch (error) {
  } finally {
    dialogData.value.loading = false;
  }
};

const handleGoPage = (routeName: string, gateway: GatewayListItem) => {
  if (gateway.kind === 1 && routeName === 'apigwResource') {
    router.push({
      name: 'apigwResourceVersion',
      params: {
        id: gateway.id,
      },
    });
  } else {
    router.push({
      name: routeName,
      params: {
        id: gateway.id,
      },
    });
  }
};

const resetDialogData = () => {
  initDialogData.name = '';
  initDialogData.maintainers = [user.user.username];
  initDialogData.description = '';
  initDialogData.is_public = true;
};

// 列表排序
const handleChange = (v: string) => {
  switch (v) {
    case 'created_time':
      // @ts-ignore
      gatewaysList.value.sort((a: any, b: any) => new Date(b.created_time) - new Date(a.created_time));
      break;
    case 'updated_time':
      // @ts-ignore
      gatewaysList.value.sort((a: any, b: any) => new Date(b.updated_time) - new Date(a.updated_time));
      break;
    case 'name':
      // @ts-ignore
      gatewaysList.value.sort((a: any, b: any) => a.name.charAt(0).localeCompare(b.name.charAt(0)));
      break;
    default:
      break;
  }
};

const tipsContent = (data: any[]) => {
  return h('div', {}, [
    data.map((item: any) => h('div', { style: 'display: flex; align-items: center', class: 'mt5 tips-cls' }, [h('i', {
      class: `ag-dot mr5 ${item.released ? 'success' : ''}`,
    }), item.name])),
  ]);
};

const handleClearFilterKey = () => {
  filterNameData.value = { keyword: '', kind: '' };
  filterKey.value = 'updated_time';
  getGatewaysListData();
  updateTableEmptyConfig();
};

const updateTableEmptyConfig = () => {
  const searchParams = {
    ...filterNameData.value,
  };
  const list = Object.values(searchParams).filter(item => item !== '');
  tableEmptyConf.value.isAbnormal = pagination.value.abnormal;
  if (list.length && !gatewaysList.value.length) {
    tableEmptyConf.value.keyword = 'placeholder';
    return;
  }
  if (list.length) {
    tableEmptyConf.value.keyword = '$CONSTANT';
    return;
  }
  tableEmptyConf.value.keyword = '';
};

watch(
  () => gatewaysList.value, () => {
    updateTableEmptyConfig();
  },
  {
    deep: true,
  },
);
</script>

<style lang="scss" scoped>
.create-gw-form {
  .form-item-name {
    :deep(.bk-form-error) {
      position: relative;
    }
  }
  .form-item-name-tips {
    position: relative;
    top: -24px;
  }
}
.home-container{
  width: 80%;
  margin: 0 auto;
  font-size: 14px;
  min-width: 1200px;
  .title-container {
    width: 100%;
    padding: 28px 16px;
    position: sticky;
    top: 0;
    z-index: 9;
    background-color: #f5f7fa;
    .left {
      font-size: 20px;
      color: #313238;
      flex: 0 0 60%;
    }
  }
  .gateway-kind-sel {
    width: 150px;
  }
  .select-cls {
    flex-shrink: 0;
    width: 126px;

    :deep(.bk-select-trigger) {
      background-color: #fff;
    }
    :deep(.bk-input) {
      padding: 0 10px;
      font-size: 14px;
    }
    :deep(.angle-up) {
      width: 24px;
      height: 32px;
      font-size: 24px;
    }
    :deep(.bk-input--text) {
      padding-right: 4px;
    }
    .prefix-cls {
      background: #fff;
      color: #979ba5;
      i{
        transform: rotate(90deg);
        font-size: 16px;
      }
    }
  }
  .table-container {
    width: 100%;
    min-height: calc(100vh - 192px);
    .table-header {
      width: 100%;
      color: #979ba5;
      padding: 0 16px 10px 16px;
      position: sticky;
      top: 88px;
      background-color: #f5f7fa;
    }
    .table-list{
      height: calc(100% - 45px);
      overflow-y: auto;
      .table-item{
        width: 100%;
        height: 80px;
        background: #FFFFFF;
        box-shadow: 0 2px 4px 0 #1919290d;
        border-radius: 2px;
        padding: 0 16px;
        margin: 12px 0px;
        .name-logo{
          width: 48px;
          height: 48px;
          line-height: 48px;
          text-align: center;
          background: #F0F5FF;
          border-radius: 4px;
          color: #3A84FF;
          font-size: 26px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          .kind {
            content: ' ';
            position: absolute;
            width: 15px;
            height: 15px;
            border-radius: 2px;
            top: 0;
            left: 0;
            font-size: 10px;
            line-height: 12px;
            &.normal {
              color: #1768EF;
              background: #E1ECFF;
              border: 1px solid #699DF4;
            }
            &.program {
              color: #299E56;
              background: #EBFAF0;
              border: 1px solid #A1E3BA;
            }
          }
        }
        .name{
          font-weight: 700;
          color: #313238;
          cursor: pointer;
          &:hover{
            color: #3a84ff;
          }
        }
        .env{
          overflow: hidden;
        }
        .environment-tag {
          margin-right: 8px;
        }
      }
      .table-item:nth-of-type(1) {
        margin-top: 0px
       };

       .newly-item{
        background: #F2FFF4;
       }
    }
    .of1{
        flex: 0 0 10%;
      }
    .of3{
      flex: 0 0 30%;
    }

    .empty-table {
      :deep(.bk-table-head) {
        display: none;
      }
    }
    .empty-container {
      .empty-exception {
        background-color: #fff;
        padding-bottom: 40px;
      }
    }
  }

  .footer-container{
    position: relative;
    left: 0;
    height: 50px;
    line-height: 20px;
    // padding: 20px 0;
    display: flex;
    flex-flow: column;
    align-items: center;
    font-size: 12px;
  }

  .deact {
    background: #EAEBF0 !important;
    color: #fff !important;
    &-name{
      color: #979BA5 !important;
    }
  }

  .default-c {
    cursor: pointer;
  }
  .none {
    color: #C4C6CC;
  }
}
.ag-dot{
    width: 8px;
    height: 8px;
    display: inline-block;
    vertical-align: middle;
    border-radius: 50%;
    border: 1px solid #C4C6CC;
  }
  .success{
    background: #e5f6ea;
    border: 1px solid #3fc06d;
  }

  .tips-cls{
    background: #f0f1f5;
    padding: 3px 8px;
    border-radius: 2px;
    cursor: default;
    &:hover{
      background: #d7d9e1 !important;
    }
  }
</style>
