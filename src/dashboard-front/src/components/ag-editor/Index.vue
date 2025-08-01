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
  <div class="codemirror">
    <div
      id="monacoEditor"
      ref="monacoEditor"
      class="monaco-editor"
      :style="style"
    />
    <div class="tools">
      <span
        v-if="showFormat"
        v-bk-tooltips="t('格式化')"
        class="icon apigateway-icon icon-ag-geshihua tool-icon"
        @click="handleFormat"
      />
      <CopyShape
        v-if="showCopy && !isFullScreen"
        v-bk-tooltips="t('复制')"
        class="tool-icon"
        @click="handleCopy"
      />
      <template v-if="showFullScreen">
        <FilliscreenLine
          v-show="!isFullScreen"
          v-bk-tooltips="t('全屏')"
          class="tool-icon"
          @click="handleFullScreen"
        />
        <span
          v-show="isFullScreen"
          v-bk-tooltips="t('退出全屏')"
          class="icon apigateway-icon icon-ag-un-full-screen-2 tool-icon"
          @click="handleFullScreen"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { copy } from '@/utils';
import { CopyShape, FilliscreenLine } from 'bkui-vue/lib/icon';

interface IProps {
  modelValue?: string | object | Array<string | object>
  language?: string
  readOnly?: boolean
  width?: string | number
  height?: string | number
  theme?: string
  minimap?: boolean
  showFormat?: boolean
  showCopy?: boolean
  showFullScreen?: boolean
}

const {
  modelValue = 'yaml',
  language = 'yaml',
  readOnly = false,
  width = '100%',
  height = '100%',
  theme = 'vs-dark',
  minimap = true,
  showFormat = false,
  showCopy = false,
  showFullScreen = false,
} = defineProps<IProps>();

const emit = defineEmits<{
  'change': [data: any, data: Event]
  'update:modelValue': [data: any, data: Event]
  'findStateChanged': [data: boolean]
}>();

const { t } = useI18n();

let editor = null; // 编辑器实例
const monacoEditor = ref();
// 编辑器装饰器（高亮效果等）
let decorations = [];
// 编辑器下划波浪线
let markers = [];
// 可切换字号范围
const fontSizeOptions = [14, 20, 24];
// 可切换行高范围
const lineHeight = [24, 30, 34];
// 当前选中字号的index
const currentFontSizeIndex = ref(0);

// 挂载
onMounted(() => {
  initEditor();
});

// 卸载
onBeforeMount(() => {
  editor?.dispose();
  editor = null;
});

const style = computed(() => ({
  width: typeof width === 'number' ? `${width}px` : width,
  height: typeof height === 'number' ? `${height}px` : height,
}));

// 设置值
const setValue = (value) => {
  try {
    if (!editor) return null;
    return editor.setValue(value);
  }
  catch (err) {
    console.log('err', err);
  }
};

// 非只读模式时，建议手动调用setValue方法，watch在双向绑定时会让编辑器抖动
watch(() => modelValue, () => {
  if (readOnly) {
    setValue(modelValue);
  }
});

// 获取编辑器中的值
const getValue = () => {
  if (!editor) return '';
  return editor.getValue();
};

// 初始化编辑器
const initEditor = () => {
  editor = monaco.editor.create(monacoEditor.value, {
    value: modelValue,
    theme: theme, // 主题
    language: language,
    folding: true, // 是否折叠
    foldingHighlight: true, // 折叠等高线
    foldingStrategy: 'indentation', // 折叠方式  auto | indentation
    showFoldingControls: 'always', // 是否一直显示折叠 always | mouseover
    disableLayerHinting: true, // 等宽优化
    emptySelectionClipboard: false, // 空选择剪切板
    selectionClipboard: false, // 选择剪切板
    automaticLayout: true, // 自动布局
    codeLens: false, // 代码镜头
    scrollBeyondLastLine: false, // 滚动完最后一行后再滚动一屏幕
    colorDecorators: true, // 颜色装饰器
    accessibilitySupport: 'off', // 辅助功能支持  "auto" | "off" | "on"
    lineNumbers: 'on', // 行号 取值： "on" | "off" | "relative" | "interval" | function
    lineNumbersMinChars: 5, // 行号最小字符   number
    readOnly: readOnly, // 是否只读  取值 true | false
    lineHeight: 24,
    glyphMargin: false, // 是否显示行号左侧装饰，用于显示当前行的错误信息等级：error | warning
    minimap: { enabled: minimap }, // 小地图
    wordWrap: 'on', // 启用 soft-wraps
    contextmenu: false, // 禁用右键菜单
  });

  editorMounted(); // 编辑器初始化后
  // 初始化编辑器装饰
  decorations = editor.createDecorationsCollection([]);
  // 定义一个资源导入导出页要用的主题
  monaco.editor.defineTheme('import-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#1A1A1A' },
  });

  // 全屏监听
  const domNode = editor.getDomNode();
  const container = (domNode.parentNode).parentNode;
  if (container) {
    container.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        isFullScreen.value = false;
      }
    });
  }
};

const editorMounted = () => {
  editor.onDidChangeModelContent((event) => {
    const yamlValue = getValue();
    emitChange(yamlValue, event);
  });

  // 监听搜索工具状态变化，把可视状态传递出去
  editor.getContribution('editor.contrib.findController')
    ?.getState()
    ?.onFindReplaceStateChange(() => {
      const isVisible = editor.getContribution('editor.contrib.findController')
        .getState().isRevealed;
      emit('findStateChanged', isVisible);
    });
};

// 修改editor的值
const emitChange = (emitValue, event) => {
  emit('change', emitValue, event);
  emit('update:modelValue', emitValue, event);
};

// 更改光标位置
const setCursorPos = ({ lineNumber = null, toBottom = false }) => {
  const model = editor.getModel();

  if (!model) return;

  let _lineNumber = lineNumber;

  // 如果直接跳转到底部, 获取最后一行的行号
  if (toBottom === true) _lineNumber = model.getLineCount();

  const lastColumnNumber = model.getLineLastNonWhitespaceColumn(_lineNumber);
  editor.focus();
  editor.setPosition(new monaco.Position(_lineNumber, lastColumnNumber));
  editor.revealLineInCenter(_lineNumber);
};

const genLineDecorations = (decorationOptions) => {
  const decoOptions = decorationOptions.filter(o => o.position)
    .map(o => ({
      range: {
        startLineNumber: o.position.lineNumber,
        endLineNumber: o.position.lineNumber,
        startColumn: o.position.column,
        endColumn: o.position.column,
      },
      options: {
        isWholeLine: true, // 整行高亮
        className:
          'line-highlight-error', // 当前行装饰用类名
        glyphMarginClassName:
          'apigateway-icon icon-ag-exclamation-circle-fill f14', // 当前行左侧装饰(glyph)用类名
      },
    }));
  decorations = editor.createDecorationsCollection(decoOptions);
};

const setDecorations = () => {
  if (decorations.length > 0) {
    decorations.set();
  }
};

const clearDecorations = () => {
  decorations.clear();
};

const genMarkers = (errors) => {
  // console.log(errors);
  errors.forEach((error) => {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: error.message,
      startLineNumber: error.position.lineNumber,
      startColumn: error.position.column,
      endLineNumber: error.position.lineNumber,
      endColumn: editor.getModel()?.getLineLastNonWhitespaceColumn(error.position.lineNumber),
    });
  });
};

const setMarkers = () => {
  monaco.editor.setModelMarkers(editor.getModel(), 'owner', markers);
};

const clearMarkers = () => {
  markers = [];
  setMarkers();
};

const getModel = () => editor.getModel();

const showFindPanel = () => {
  editor.trigger('', 'actions.find');
};

const closeFindPanel = () => {
  editor.trigger('', 'closeFindWidget');
};

const switchFontSize = () => {
  currentFontSizeIndex.value = (currentFontSizeIndex.value + 1) % fontSizeOptions.length;
  editor.updateOptions({
    fontSize: fontSizeOptions[currentFontSizeIndex.value],
    lineHeight: lineHeight[currentFontSizeIndex.value],
  });
};

const handleFormat = () => {
  if (language === 'json') { // 格式化 JSON 文档
    editor.trigger('a', 'editor.action.formatDocument');
  }
  // yaml 格式 需 npm i yamljs 拓展支持
};

const handleCopy = () => {
  copy(editor.getValue());
};

// 全屏开关变量
const isFullScreen = ref(false);
const handleFullScreen = () => {
  const domNode = editor.getDomNode();
  const container = (domNode.parentNode).parentNode;

  if (isFullScreen.value) {
    document.exitFullscreen();
    isFullScreen.value = false;
  }
  else {
    container?.requestFullscreen();
    isFullScreen.value = true;
  }
  editor.layout();
};

const setTheme = (theme) => {
  monaco.editor.setTheme(theme);
};

const updateOptions = (options) => {
  editor.updateOptions(options);
};

defineExpose({
  setValue,
  setCursorPos,
  setDecorations,
  clearDecorations,
  genLineDecorations,
  setMarkers,
  clearMarkers,
  genMarkers,
  getModel,
  getValue,
  showFindPanel,
  closeFindPanel,
  switchFontSize,
  setTheme,
  updateOptions,
  handleFormat,
});

</script>

<style scoped lang="scss">
.codemirror {
  position: relative;
  width: 100%;
  height: calc(100% - 26px);

  .monaco-editor {
    position: absolute;
    inset: 26px 0 0;
  }

  .tools {
    position: absolute;
    top: 5px;
    right: 14px;
    display: flex;
    align-items: center;

    .tool-icon {
      margin-left: 12px;
      font-size: 16px;
      color: #979BA5;
      cursor: pointer;

      &:hover {
        color: #3A84FF;
      }
    }
  }
}
</style>
