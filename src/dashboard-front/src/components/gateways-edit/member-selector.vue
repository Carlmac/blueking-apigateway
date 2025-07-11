<template>
  <div ref="memberSelectorEditRef" class="gateways-edit-member-selector" :style="styles">
    <template v-if="!isEditable">
      <div class="edit-wrapper">
        <div class="edit-content">
          <slot>
            <template v-if="membersText">
              <span class="member-item">
                <bk-popover>
                  <bk-user-display-name :user-id="membersText" />
                  <template #content>
                    <span><bk-user-display-name :user-id="membersText" /></span>
                  </template>
                </bk-popover>
              </span>
            </template>
            <template v-else>--</template>
          </slot>
        </div>
        <div class="edit-action-box" v-if="isEditMode">
          <i class="apigateway-icon icon-ag-edit-small edit-action" @click.self.stop="handleEdit" />
        </div>
      </div>
    </template>
    <div v-else class="edit-mode-content">
      <main class="edit-member-wrap">
        <MemberSelector
          ref="memberSelectorRef" v-model="displayValue"
          :class="['edit-selector', { [isErrorClass]: isShowError }]"
          :placeholder="placeholder"
          :has-delete-icon="true"
          style="width: 500px"
          @change="handleChange"
          @keydown="handleEnter" />
        <aside class="edit-member-actions">
          <bk-pop-confirm
            width="288"
            :content="t('您已将自己从维护人员列表中移除，移除后您将失去查看和编辑网关的权限。请确认！')"
            trigger="click"
            ext-cls="confirm-custom-btn"
            @confirm="handleSubmit"
            @cancel="handleCancel"
            v-if="!displayValue?.includes(user.user.username)"
          >
            <bk-button style="width: 32px">
              <i class="apigateway-icon icon-ag-check-1 f24" style="color: #3A84FF;"></i>
            </bk-button>
          </bk-pop-confirm>
          <bk-button v-else style="width: 32px" @click.stop="handleSubmit">
            <i class="apigateway-icon icon-ag-check-1 f24" style="color: #3A84FF;"></i>
          </bk-button>

          <bk-button style="width: 32px" @click="handleCancel">
            <i class="apigateway-icon icon-ag-icon-close f24"></i>
          </bk-button>
        </aside>
      </main>
      <p class="validate-error-tips" v-if="isShowError">{{ errorTips }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';
import MemberSelector from '../member-select';
import { useUser } from '@/store/user';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  field: {
    type: String,
    required: true,
  },
  content: {
    type: Array,
    default: () => [],
  },
  width: {
    type: String,
    default: 'auto',
  },
  placeholder: {
    type: String,
    default: '请输入',
  },
  mode: {
    type: String,
    default: 'edit',
    validator(value: string) {
      return ['detail', 'edit'].includes(value);
    },
  },
  isRequired: {
    type: Boolean,
    default: true,
  },
  isErrorClass: {
    type: String,
    default: '',
  },
  errorValue: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['on-change']);
const user = useUser();
const { t } = useI18n();

const memberSelectorRef = ref();
const memberSelectorEditRef = ref();
const isShowError = ref(false);
const isEditable = ref(false);
const errorTips = ref('');
const displayValue = ref([]);

// const handleValidate = () => {
//   isShowError.value = false;
//   errorTips.value = '';
// };

const handleEdit = () => {
  document.body.click();
  isEditable.value = true;
  nextTick(() => {
    memberSelectorRef.value?.tagInputRef?.focusInputTrigger();
  });
};

const handleSubmit = () => {
  if (!isEditable.value) return;
  triggerChange();
};

const handleCancel = () => {
  isEditable.value = false;
  displayValue.value = [...props.content];
};

const handleChange = () => {
  if (props.isRequired && !displayValue.value.length) {
    isShowError.value = true;
    errorTips.value = props.errorValue;
    return;
  }
  isEditable.value = true;
  nextTick(() => {
    memberSelectorRef.value?.tagInputRef?.focusInputTrigger();
  });
};

const handleEnter = (event: any) => {
  if (!isEditable.value) return;
  if (!displayValue.value?.includes(user.user.username)) {
    isShowError.value = true;
    errorTips.value = t('您已将自己从维护人员列表中移除，移除后您将失去查看和编辑网关的权限。请确认！');
    return;
  }
  if (event.key === 'Enter' && event.keyCode === 13) {
    triggerChange();
  }
};

const triggerChange = () => {
  if (props.isRequired && !displayValue.value.length) {
    isShowError.value = true;
    errorTips.value = props.errorValue;
    return;
  }
  isEditable.value = false;
  if (JSON.stringify(displayValue.value) === JSON.stringify(props.content)) {
    return;
  }
  emit('on-change', {
    [props.field]: displayValue.value,
  });
};

const styles = computed(() => {
  return {
    width: props.width,
  };
});

const isEditMode = computed(() => {
  return props.mode === 'edit';
});

const membersText = computed(() => {
  return displayValue.value.join(', ');
});

watch(
  () => props.content,
  (payload: any[]) => {
    displayValue.value = [...payload];
  },
  { immediate: true },
);

watch(
  () => props.errorValue,
  (payload: string) => {
    errorTips.value = payload;
  },
  { immediate: true },
);

</script>

<style lang="scss" scoped>
.gateways-edit-member-selector {
  position: relative;

  .edit-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    &:hover {
      .edit-action {
        display: block;
      }
    }

    .edit-content {
      flex: 0 0 auto;
      max-width: calc(100% - 25px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 32px;

      .member-item {
        line-height: 32px;
        font-size: 12px;
        width: calc(100% - 25px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        i {
          font-size: 18px;
          color: #979ba5;
          vertical-align: middle;
          cursor: pointer;

          &.disabled {
            color: #c4c6cc;
            cursor: not-allowed;
          }
        }
      }
    }

    .edit-selector {
      width: 100%;
    }
  }

  .edit-mode-content {
    .edit-member-wrap {
      display: flex;
      align-items: center;

      .edit-member-actions {
        margin-left: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.edit-action-box {
  display: flex;
  align-items: center;
  margin-right: auto;

  .icon-ag-edit-small {
    font-size: 26px;
    color: #979BA5;
    cursor: pointer;
    display: none;

    &:hover {
      color: #3a84ff;
    }
  }
}

:deep(.maintainers-error-tip) {
  .bk-tag-input-trigger {
    border-color: red;
  }
}

.validate-error-tips {
  font-size: 12px;
  color: #ff4d4d;
}
</style>

<style lang="scss">
.confirm-custom-btn {
  .bk-button.bk-button-primary {
    background-color: #E71818;
    border-color: #E71818;
    &:hover {
      background-color: #ff5656;
      border-color: #ff5656;
    }
  }
}
</style>
