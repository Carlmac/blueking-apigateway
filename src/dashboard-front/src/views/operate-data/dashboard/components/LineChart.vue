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
  <div class="chart-wrapper">
    <div class="chart-title">
      {{ title || '--' }}
    </div>

    <div v-show="!isEmpty">
      <div
        :id="instanceId"
        class="line-chart"
        :class="[['requests', 'non_20x_status'].includes(instanceId) ? 'mini' : 'middle']"
      />

      <div
        v-if="chartLegend[instanceId]"
        class="chart-legend custom-scroll-bar"
        :class="[{ 'side-legend': instanceId === 'non_20x_status' }]"
      >
        <div
          v-for="({ color, name, selected }, legendIndex) in chartLegend[instanceId]"
          :key="legendIndex"
          class="legend-item"
          :class="[selected]"
          @click.stop="() => handleClickLegend(legendIndex)"
        >
          <div
            class="legend-icon"
            :style="{ background: color }"
          />
          <div class="legend-name">
            {{ name }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-show="isEmpty"
      class="ap-nodata basic-height"
    >
      <TableEmpty
        :empty-type="tableEmptyConf.emptyType"
        :abnormal="tableEmptyConf.isAbnormal"
        @refresh="handleInit"
        @clear-filter="handleClearFilterKey"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts';
import { merge } from 'lodash-es';
import dayjs from 'dayjs';
import { useChartIntervalOption } from '@/hooks';
import type { ISearchParamsType, ISeriesItemType } from '@/services/source/dashboard';
import TableEmpty from '@/components/table-empty/Index.vue';
import { getColorHue } from '@/utils';

interface IProps {
  instanceId?: string
  title?: string
  chartData?: object
}

const {
  instanceId = '', // 生成图表的元素id
  title = '响应耗时', // 图表 title
  chartData = {}, // 图表数据
} = defineProps<IProps>();

const emit = defineEmits<{
  'clear-params': [void]
  'report-init': [void]
}>();

const { t } = useI18n();

interface LegendItem {
  color: string
  name: string
  selected: string
};

interface ChartLegend {
  requests_total?: LegendItem
  health_rate?: LegendItem
  requests?: LegendItem
  non_20x_status?: LegendItem
  app_requests?: LegendItem
  resource_requests?: LegendItem
  ingress?: LegendItem
  egress?: LegendItem
  response_time_90th?: LegendItem
};

const { getChartIntervalOption } = useChartIntervalOption();

const myChart = shallowRef();
const chartLegend = ref<ChartLegend>({});
const searchParams = ref<ISearchParamsType>();
const isEmpty = ref<boolean>(false);
const tableEmptyConf = ref<{
  emptyType: string
  isAbnormal: boolean
}>({
  emptyType: '',
  isAbnormal: false,
});

onMounted(() => {
  const chartDom = document.getElementById(instanceId);
  myChart.value = echarts.init(chartDom as HTMLDivElement);

  window.addEventListener('resize', chartResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', chartResize);
});

watch(
  () => chartData,
  (data) => {
    if (!data?.series?.length) {
      isEmpty.value = true;
      updateTableEmptyConfig();
    }
    else {
      isEmpty.value = false;
      renderChart();
    }
  },
  { deep: true },
);

const handleClearFilterKey = () => {
  emit('clear-params');
};

const handleInit = () => {
  emit('report-init');
};

const updateTableEmptyConfig = () => {
  const list = Object.values(searchParams.value).filter(item => !!item);
  if (list.length > 0) {
    tableEmptyConf.value.emptyType = 'searchEmpty';
    return;
  }
  if (searchParams.value.stage_id) {
    tableEmptyConf.value.emptyType = 'empty';
    return;
  }
  tableEmptyConf.value.emptyType = '';
};

const chartResize = () => {
  nextTick(() => {
    myChart.value?.resize();
  });
};

const getChartOption = () => {
  const baseOption: echarts.EChartOption = {
    // title: {
    //   text: title,
    //   top: 12,
    //   left: 24,
    //   textStyle: {
    //     color: '#313238',
    //     fontSize: 14,
    //     fontWeight: 'bold',
    //     lineHeight: 22,
    //   },
    // },
    // 设置距离右侧的间距
    grid: { right: '8%' },
    xAxis: {
      type: 'time',
      scale: true, // 设置成 true 后坐标刻度不会强制包含零刻度
      boundaryGap: false,
      axisLabel: { // 坐标轴刻度标签的相关设置
        color: '#666666',
        fontSize: 12,
        padding: [0, 5, 0, 0],
      },
      axisLine: { // 坐标轴轴线相关设置
        lineStyle: { color: '#DCDEE5' },
      },
      axisTick: { // 坐标轴刻度相关设置。
        show: false,
      },
      splitLine: { // 坐标轴在 grid 区域中的分隔线
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { // 坐标轴刻度标签的相关设置
        color: '#666666',
        fontSize: 12,
        padding: [0, 5, 0, 0],
      },
      splitLine: { // 坐标轴在 grid 区域中的分隔线
        lineStyle: {
          color: '#e9edf0',
          type: 'dashed',
        },
      },
      axisLine: { // 坐标轴轴线相关设置
        show: false,
      },
      axisTick: { // 坐标轴刻度相关设置
        show: false,
      },
    },
    series: [{
      data: [],
      type: 'line',
      connectNulls: true, // 是否连接空数据
      symbol: 'circle', // 拐点标记的形状
      symbolSize: 5, // 拐点标记的大小
      itemStyle: { // 折线拐点标志的样式
        normal: {
          borderColor: 'rgba(0,0,0,0)', // 边框颜色透明，去除边框
          borderWidth: 0, // 边框宽度为0
        },
      },
      lineStyle: { width: 1 },
      markPoint: { symbolSize: 12 },
    }],
    legend: { show: false },
  };

  const chartOption: echarts.EChartOption = {
    xAxis: {},
    yAxis: {},
    series: [],
    tooltip: {},
    legend: {},
    grid: {},
  };

  let moreOption = {};

  if (instanceId !== 'response_time') {
    chartData?.series?.forEach((item: ISeriesItemType) => {
      let datapoints = item.datapoints || [];
      datapoints = datapoints.filter((value: Array<number>) => !isNaN(Math.round(value[0])));
      chartOption.series.push(merge({}, baseOption.series[0], {
        name: (item.target?.split('=')[1])?.replace(/"/g, ''),
        data: datapoints.map((item) => {
          if (instanceId === 'ingress' || instanceId === 'egress') {
            return [
              item[1],
              (item[0] / 1024).toFixed(2),
            ];
          }
          return [
            item[1],
            item[0],
          ];
        }),
      }));
      moreOption = getChartMoreOption(datapoints);
    });
    // 设置图表颜色
    chartOption.color = generateChartColor(chartData.series ?? []);

    if (instanceId === 'requests') {
      // 总请求数
      chartOption.tooltip.formatter = (params: echarts.EChartOption.Tooltip.Format) => {
        return `<div>
      <p>${dayjs(params.data[0]).format('YYYY-MM-DD HH:mm:ss')}</p>
      <p><span class="tooltip-icon">${params.marker}${t('总请求数')}: </span><span>${params.data[1] !== null ? params.data[1].toLocaleString() : '0'} ${t('次')}</span></p>
      </div>`;
      };
    }
    else if (instanceId === 'response_time_90th') {
      // 资源 90th 响应耗时分布
      chartOption.tooltip.formatter = (params: echarts.EChartOption.Tooltip.Format) => {
        return `<div>
      <p>${dayjs(params.data[0]).format('YYYY-MM-DD HH:mm:ss')}</p>
      <p><span class="tooltip-icon">${params.marker}${params.seriesName}: </span><span>${params.data[1] !== null ? params.data[1].toLocaleString() : '0'} ms</span></p>
      </div>`;
      };
    }
    else if (['ingress', 'egress'].includes(instanceId)) {
      // ingress 带宽占用 && egress 带宽占用
      chartOption.tooltip.formatter = (params: echarts.EChartOption.Tooltip.Format) => {
        return `<div>
      <p>${dayjs(params.data[0]).format('YYYY-MM-DD HH:mm:ss')}</p>
      <p><span class="tooltip-icon">${params.marker}${params.seriesName}: </span><span>${params.data[1] !== null ? params.data[1].toLocaleString() : '0'} KB</span></p>
      </div>`;
      };
    }
    else {
      // 设置图表tooltip内容
      chartOption.tooltip.formatter = (params: echarts.EChartOption.Tooltip.Format) => {
        return `<div>
      <p>${dayjs(params.data[0]).format('YYYY-MM-DD HH:mm:ss')}</p>
      <p><span class="tooltip-icon">${params.marker}${params.seriesName}: </span><span>${params.data[1] !== null ? params.data[1].toLocaleString() : '0'} ${t('次')}</span></p>
      </div>`;
      };
    }

    if (['requests', 'non_20x_status'].includes(instanceId)) {
      chartOption.grid.left = '18%';
      if (document.body.clientWidth < 1550) {
        chartOption.xAxis.axisLabel = { rotate: 35 };
      }
    }

    if (instanceId === 'ingress' || instanceId === 'egress') {
      chartOption.yAxis.axisLabel = { formatter: '{value} KB' };
    }

    if (instanceId === 'response_time_90th') {
      chartOption.yAxis.axisLabel = { formatter: '{value} ms' };
    }
  }
  else {
    const datapoints = [
      (chartData?.response_time_90th?.series[0] || {})?.datapoints || [],
      (chartData?.response_time_80th?.series[0] || {})?.datapoints || [],
      (chartData?.response_time_50th?.series[0] || {})?.datapoints || [],
    ];
    // const seriesNames = ['90%', '80%', '50%'];
    const seriesNames = ['90%'];
    datapoints.forEach((data, index: number) => {
      const values = data.filter((value: Array<number>) => !isNaN(Math.round(value[0])));
      chartOption.series.push(merge({}, baseOption.series[0], {
        name: seriesNames[index],
        data: values.map((item: Array<number>) => ([
          item[1],
          Math.round(item[0]),
        ])),
      }));
    });

    chartOption.yAxis.axisLabel = { formatter: '{value} ms' };

    const serieData = datapoints.reduce((a, b) => a.concat(b), []);
    moreOption = getChartMoreOption(serieData);
  }
  return merge(baseOption, chartOption, moreOption);
};

const getChartMoreOption = (seriesData: Array<Array<number>>) => {
  // 1. 根据data的最大值，动态计算出max合适值和interval配置
  const serieData = seriesData.map((item: Array<number>) => Math.round(item[0]))
    .filter((item: number) => !isNaN(item));
  const maxNumber = Math.max(...serieData);
  const yAxisIntervalOption = getChartIntervalOption(maxNumber, 'number', 'yAxis');

  // 2. 根据时间值计算xAxis显示年/月/日/时间部分
  const xAxisData = seriesData.map((item: Array<number>) => Math.round(item[1]));
  xAxisData.sort((a: number, b: number) => a - b);
  // timeDuration 需要秒为单位
  const timeDuration = Math.round((xAxisData[xAxisData.length - 1] - xAxisData[0]) / 1000);
  const xAxisIntervalOption = getChartIntervalOption(timeDuration, 'time', 'xAxis');

  return merge(yAxisIntervalOption, xAxisIntervalOption);
  // return xAxisIntervalOption;
};

const generateChartColor = (chartData: ISeriesItemType[]) => {
  let baseColor = ['#3A84FF', '#5AD8A6', '#5D7092', '#F6BD16', '#FF5656', '#6DC8EC', '#FFB43D', '#4BC7AD', '#FF7756', '#B5E0AB'];
  let angle = 30;
  if (instanceId.indexOf('failed_') !== -1) {
    baseColor = ['#FF5656', '#5AD8A6'];
    angle = 10;
  }
  const colors: string[] = [];
  const interval = Math.ceil(chartData.length / baseColor.length);

  baseColor.forEach((color) => {
    let i = 0;
    while (i < interval) {
      const co = getColorHue(color, i * angle);
      colors.push(co);
      i += 1;
    }
  });

  const finalColors = colors.reduce((a, b) => a.concat(b), []);
  return finalColors;
};

const generateChartLegend = () => {
  const option = myChart.value?.getOption();
  // 只有一个系列不需要图例
  if (option.series.length > 1) {
    chartLegend.value[instanceId] = option?.series?.map((serie: echarts.EChartOption.Series, index: number) => ({
      color: option.color[index],
      name: serie.name,
      selected: 'all',
    }));
  }
  else {
    chartLegend.value[instanceId] = null;
  }
};

const handleClickLegend = (index: number) => {
  const legend = chartLegend.value[instanceId];
  const currentLegend = legend[index];

  const { selected } = currentLegend;

  // 实现切换单选显示
  if (selected !== 'selected') {
    // 仅显示选中
    myChart.value.dispatchAction({
      type: 'legendUnSelect',
      batch: legend.map(({ name }: LegendItem) => ({ name })),
    });
    myChart.value.dispatchAction({
      type: 'legendSelect',
      name: currentLegend.name,
    });

    // 选中状态设置
    legend.forEach((item: LegendItem, i: number) => {
      item.selected = index === i ? 'selected' : 'unselected';
    });
    chartLegend.value = {
      ...chartLegend.value,
      ...{ [instanceId]: legend },
    };
  }
  else {
    // 全部显示
    myChart.value.dispatchAction({
      type: 'legendSelect',
      batch: legend.map(({ name }: LegendItem) => ({ name })),
    });

    legend.forEach((item: LegendItem) => (item.selected = 'all'));
    chartLegend.value = {
      ...chartLegend.value,
      ...{ [instanceId]: legend },
    };
  }
};

const renderChart = () => {
  nextTick(() => {
    const option = getChartOption();
    myChart.value?.setOption(option, { notMerge: true });
    chartResize();
    generateChartLegend();
  });
};

const syncParams = (params: ISearchParamsType) => {
  searchParams.value = params;
};

defineExpose({ syncParams });
</script>

<style lang="scss" scoped>
@use "sass:color";

.chart-wrapper {
  position: relative;
  .chart-title {
    padding: 12px 24px 0;
    color: '#313238';
    font-size: 14px;
    font-weight: 'bold';
    line-height: 22px;
  }
  .line-chart {
    &.mini {
      height: 286px;
    }
    &.middle {
      height: 326px;
    }
  }
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    margin: 0 40px;
    height: 70px;
    max-height: 110px;
    overflow-y: auto;

    .legend-item {
      display: flex;
      align-items: center;
      flex: none;
      font-size: 12px;
      line-height: 22px;
      margin-right: 12px;
      color: #777;
      white-space: nowrap;
      cursor: pointer;

      &:hover,
      &.selected {
        color: #333;
      }

      &.unselected {
        color: #ccc;
      }
    }
    .legend-icon {
      height: 4px;
      background: #999;
      flex: none;
      width: 16px;
      border-radius: 2px;
      margin-right: 3px;
    }
  }
  .side-legend {
    position: absolute;
    right: -34px;
    top: 10px;
    flex-direction: column;
    height: 220px;
    max-height: 242px;
  }
  .custom-scroll-bar {
    &::-webkit-scrollbar {
      width: 4px;
      background-color: color.scale(#C4C6CC, $lightness: 80%);
    }

    &::-webkit-scrollbar-thumb {
      height: 5px;
      border-radius: 2px;
      background-color: #c4c6cc;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}
:deep(.tooltip-icon) {
  margin-right: 6px;
  span {
    height: 4px !important;
    width: 16px !important;
    border-radius: 2px !important;
    vertical-align: middle;
  }
}
.basic-height {
  height: 286px;
}
</style>
