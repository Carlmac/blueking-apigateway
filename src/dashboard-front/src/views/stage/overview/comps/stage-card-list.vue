<template>
  <div class="card-list">
    <div class="card-item" v-for="(stageData, index) in stageList" :key="index">
      <div class="title">
        <div class="title-lf">
          <spinner v-if="getStatus(stageData) === 'doing'" fill="#3A84FF" />
          <span
            v-else
            :class="['dot', getStatus(stageData)]"
            v-bk-tooltips="{
              content: getStatusText(getStatus(stageData)),
              disabled: !getStatusText(getStatus(stageData)) }"
          >
          </span>
          {{ stageData.name }}
        </div>
        <div class="title-rg">
          <template v-if="!basicInfoData.status">
            <bk-button
              disabled
              size="small"
              theme="primary"
              v-bk-tooltips="{ content: t('当前网关已停用，如需使用，请先启用'), delay: 300 }">
              {{ t('发布资源') }}
            </bk-button>
            <bk-button
              class="ml10"
              disabled
              size="small"
              v-bk-tooltips="{ content: t('当前网关已停用，如需使用，请先启用'), delay: 300 }">
              {{ t('下架') }}
            </bk-button>
          </template>
          <template v-else>
            <bk-button
              theme="primary"
              size="small"
              :disabled="getStatus(stageData) === 'doing' || !!stageData.publish_validate_msg"
              v-bk-tooltips="{ content: t(stageData.publish_validate_msg), disabled: !stageData.publish_validate_msg }"
              @click="handleRelease(stageData)"
            >
              {{ t('发布资源') }}
            </bk-button>
            <bk-button
              class="ml10"
              size="small"
              :disabled="stageData.status !== 1"
              @click="handleStageUnlist(stageData.id)"
            >
              {{ t('下架') }}
            </bk-button>
          </template>
        </div>
      </div>
      <div class="content" @click="handleToDetail(stageData)">
        <div class="apigw-form-item">
          <div class="label" :class="locale === 'en' ? 'en' : ''">{{ `${t('访问地址')}：` }}</div>
          <div class="value url">
            <p
              class="link"
              v-if="getStageAddress(stageData.name)"
              v-bk-tooltips="{ content: getStageAddress(stageData.name) }">
              {{ getStageAddress(stageData.name) || '--' }}
            </p>
            <p
              v-else
              class="link"
            >
              {{ getStageAddress(stageData.name) || '--' }}
            </p>
            <i
              class="apigateway-icon icon-ag-copy-info"
              v-if="getStageAddress(stageData.name)"
              @click.self.stop="copy(getStageAddress(stageData.name))">
            </i>
          </div>
        </div>
        <div class="apigw-form-item">
          <div class="label" :class="locale === 'en' ? 'en' : ''">{{ `${t('当前生效资源版本')}：` }}</div>
          <div class="value">
            <span class="unrelease" v-if="stageData.release.status === 'unreleased'">--</span>
            <span v-else>{{ stageData.resource_version.version || '--' }}</span>
            <template v-if="getStatus(stageData) === 'doing'">
              <bk-tag theme="info" class="ml10">{{ stageData.publish_version }} {{ t('发布中') }} </bk-tag>
              <bk-button
                text
                theme="primary"
                @click.stop="showLogs(stageData.publish_id)">
                {{ t('查看日志') }}
              </bk-button>
            </template>
          </div>
        </div>
        <div class="apigw-form-item">
          <div class="label" :class="locale === 'en' ? 'en' : ''">{{ `${t('发布人')}：` }}</div>
          <div class="value">
            {{ stageData.release.created_by || '--' }}
          </div>
        </div>
        <div class="apigw-form-item">
          <div class="label" :class="locale === 'en' ? 'en' : ''">{{ `${t('发布时间')}：` }}</div>
          <div class="value">
            {{ stageData.release.created_time || '--' }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="common.curApigwData?.kind !== 1" class="card-item add-stage" @click="handleAddStage">
      <i class="apigateway-icon icon-ag-add-small" />
    </div>

    <!-- 环境侧边栏 -->
    <edit-stage-sideslider ref="stageSidesliderRef" />

    <!-- 发布资源至环境 -->
    <release-sideslider
      :current-assets="currentStage"
      ref="releaseSidesliderRef"
      @release-success="handleReleaseSuccess"
      @hidden="handleReleaseSuccess(false)"
    />

    <!-- 发布可编程网关的资源至环境 -->
    <release-programmable-slider
      ref="releaseProgrammableSliderRef"
      :current-stage="currentStage"
      @hidden="handleReleaseSuccess(false)"
      @release-success="handleReleaseSuccess"
    />

    <!-- 日志抽屉 -->
    <log-details ref="logDetailsRef" :history-id="historyId" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRefs,
} from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  InfoBox,
  Message,
} from 'bkui-vue';
import { Spinner } from 'bkui-vue/lib/icon';

import {
  copy,
  getStatus,
  getStatusText,
} from '@/common/util';
import logDetails from '@/components/log-details/index.vue';
import mitt from '@/common/event-bus';
import { useGetGlobalProperties } from '@/hooks';
import { useCommon } from '@/store';
import {
  getGateWaysInfo,
  removalStage,
} from '@/http';
import { BasicInfoParams } from '@/views/basic-info/common/type';
import editStageSideslider from './edit-stage-sideslider.vue';
import releaseSideslider from './release-sideslider.vue';
import releaseProgrammableSlider from './release-programmable-slider.vue';

// 全局变量
const globalProperties = useGetGlobalProperties();
const { GLOBAL_CONFIG } = globalProperties;
const { t, locale } = useI18n();
const route = useRoute();
const common = useCommon();

const props = defineProps<{
  stageList: any[];
}>();

// 环境列表
const { stageList } = toRefs(props);

const logDetailsRef = ref(null);
const historyId = ref();
const releaseSidesliderRef = ref();
const releaseProgrammableSliderRef = ref();
const currentStage = ref<any>({});

// 当前基本信息
const basicInfoData = ref<BasicInfoParams>({
  status: 1,
  name: '',
  url: '',
  description: '',
  description_en: '',
  public_key_fingerprint: '',
  bk_app_codes: '',
  docs_url: '',
  api_domain: '',
  created_by: '',
  created_time: '',
  public_key: '',
  maintainers: [],
  developers: [],
  is_public: true,
  is_official: false,
  related_app_codes: '',
});

// 新建环境
const stageSidesliderRef = ref(null);
let timeId: any = null;

// 网关id
const apigwId = computed(() => +route.params.id);

// 环境详情
const handleToDetail = (data: any) => {
  mitt.emit('switch-mode', { id: data.id, name: data.name });
};

// 发布资源
const handleRelease = async (stage: any) => {
  currentStage.value = stage;
  // 普通网关
  if (common.curApigwData?.kind !== 1) {
    releaseSidesliderRef.value?.showReleaseSideslider();
  } else {
    // 可编程网关
    releaseProgrammableSliderRef.value?.showReleaseSideslider();
  }
};

// 发布成功
const handleReleaseSuccess = async (loading = true) => {
  await mitt.emit('get-environment-list-data', loading);
};

// 查看日志
const showLogs = (id: string) => {
  historyId.value = id;
  logDetailsRef.value?.showSideslider();
};

// 下架环境
const handleStageUnlist = async (id: number) => {
  InfoBox({
    infoType: 'warning',
    title: t('确认下架环境？'),
    subTitle: t('可能会导致正在使用该接口的服务异常，请确认'),
    confirmText: t('确认下架'),
    onConfirm: async () => {
      const data = {
        status: 0,
      };
      try {
        await removalStage(apigwId.value, id, data);
        Message({
          message: t('下架成功'),
          theme: 'success',
        });
        // 获取网关列表
        await mitt.emit('get-environment-list-data', true);
        // 开启loading
      } catch (error) {
        console.error(error);
      }
    },
  });
};

// 访问地址
const getStageAddress = (name: string) => {
  const keys: any = {
    api_name: common.apigwName,
    stage_name: name,
    resource_path: '',
  };

  let url = GLOBAL_CONFIG.STAGE_DOMAIN;
  for (const name of Object.keys(keys)) {
    const reg = new RegExp(`{${name}}`);
    url = url?.replace(reg, keys[name]);
  }
  return url;
};
const handleAddStage = () => {
  stageSidesliderRef.value.handleShowSideslider('add');
};

// 获取网关基本信息
const getBasicInfo = async (apigwId: number) => {
  try {
    const res = await getGateWaysInfo(apigwId);
    basicInfoData.value = Object.assign({}, res);
  } catch (e) {
    console.error(e);
  }
};

onMounted(async () => {
  timeId = setInterval(() => {
    // 获取网关列表
    mitt.emit('get-environment-list-data');
  }, 1000 * 30);

  await getBasicInfo(common.apigwId);
});

onUnmounted(() => {
  clearInterval(timeId);
});

</script>

<style lang="scss" scoped>
.card-list {
  min-width: calc(1280px - 260px);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 18px; /* 设置盒子之间的间隔 */
}

/* 分辨率大于1920时 */
@media (min-width: 1921px) {
  .card-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 适应更小的分辨率，每行最多显示三个盒子 */
@media (max-width: 1920px) {
  .card-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.card-item {
  font-size: 12px;
  height: 223px;
  background: #ffffff;
  padding: 0 24px;
  box-shadow: 0 2px 4px 0 #1919290d;;
  border-radius: 2px;
  &:hover {
    box-shadow: 0 2px 4px 0 #0000001a, 0 2px 4px 0 #1919290d;
  }

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 52px;
    border-bottom: 1px solid #DCDEE5;
    .title-lf {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 700;
      color: #313238;
      span {
        margin-right: 8px;
      }
    }
    .title-rg {
      display: flex;
    }
  }

  .content {
    padding-top: 16px;
    font-size: 12px;
    cursor: pointer;
    .apigw-form-item {
      display: flex;
      align-items: center;
      line-height: 32px;
      color: #63656e;

      .label {
        padding-right: 8px;
        width: 120px;
        text-align: right;
        &.en {
          width: 158px;
        }
      }

      .value {
        max-width: 220px;
        color: #313238;
        flex-shrink: 0;

        &.url {
          max-width: 280px;
          display: flex;
          align-items: center;

          .link {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #313238;
          }

          i {
            cursor: pointer;
            color: #3A84FF;
            margin-left: 3px;
            font-size: 12px;
            padding: 3px;
          }
        }
      }
    }

    .unrelease {
      display: inline-block;
      font-size: 10px;
      // color: #FE9C00;
      // background: #FFF1DB;
      border-radius: 2px;
      padding: 2px 5px;
      line-height: 1;
    }
  }

  &.add-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    i {
      color: #979BA5;
      font-size: 40px;
    }

    &:hover {
      cursor: pointer;
      i {
        color: #3A84FF;
      }
    }
  }


  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    cursor: pointer;
    &.success {
      border: 1px solid #3FC06D;
      background: #E5F6EA;
    }

    &.unreleased {
      border: 1px solid #C4C6CC;
      background: #F0F1F5;
    }

    &.delist {
      border: 1px solid #C4C6CC;
      background: #F0F1F5;
    }

    &.failure {
      border: 1px solid #EA3636;
      background: #FFE6E6;
    }
  }
}</style>
