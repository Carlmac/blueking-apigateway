<template>
  <!--  插件配置展示态组件  -->
  <!--  header 转换插件  -->
  <bk-table
    :data="tableData"
    :columns="tableCols"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  toRefs,
} from 'vue';
import {
  IBaseTableRow,
  IColumn,
  IPlugin,
} from '@/views/components/plugin-manage/types';
import { useI18n } from 'vue-i18n';

interface IHeaderRewriteConfig {
  set?: { key: string, value: string }[]
  remove?: { key: string, value?: string }[]
}

interface IHeaderRewriteTableRow extends IBaseTableRow {
  action: string
}

interface IProps {
  plugin: IPlugin<IHeaderRewriteConfig>
  firstColWidth: string
}

const props = defineProps<IProps>();

const { t } = useI18n();

const {
  plugin,
  firstColWidth,
} = toRefs(props);

// header转换插件表格列
const tableCols = ref<IColumn[]>([
  {
    label: t('行为'),
    align: 'right',
    field: 'action',
    width: firstColWidth.value,
    index: 0,
    rowspan: ({ row }) => row.rowSpan,
  },
  {
    label: t('键'),
    field: 'key',
  },
  {
    label: t('值'),
    field: 'value',
  },
]);

// header转换插件表格数据
const tableData = computed(() => {
  const setterData: IHeaderRewriteTableRow[] = [];
  const removerData: IHeaderRewriteTableRow[] = [];
  const { config } = plugin.value;
  Object.entries(config).forEach(([action, keyValues]: [string, Array<{ key: string, value?: string }>]) => {
    if (action === 'set') {
      keyValues.forEach(({ key, value }) => {
        setterData.push({
          key,
          value,
          action: t('设置'),
        });
      });
    } else if (action === 'remove') {
      keyValues.forEach(({ key }) => {
        removerData.push({
          key,
          value: '--',
          action: t('删除'),
        });
      });
    }
  });
  if (setterData.length > 0) {
    setterData[0].rowSpan = setterData.length;
  }
  if (removerData.length > 0) {
    removerData[0].rowSpan = removerData.length;
  }
  return [...setterData, ...removerData];
});

</script>
