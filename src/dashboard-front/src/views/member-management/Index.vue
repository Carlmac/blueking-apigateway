/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
 * Copyright (C) Tencent. All rights reserved.
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
  <div class="page-wrapper-padding member-management-page">
    <div class="member-toolbar">
      <div class="toolbar-left">
        <BkButton
          theme="primary"
          @click="handleAdd"
        >
          {{ t('新增成员') }}
        </BkButton>
        <BkRadioGroup v-model="activeRole">
          <BkRadioButton
            v-for="tab in roleTabs"
            :key="tab.key"
            :label="tab.key"
          >
            {{ tab.label }} ({{ tab.count }})
          </BkRadioButton>
        </BkRadioGroup>
        <BkButton
          text
          theme="primary"
          @click="handleViewPermissionModel"
        >
          {{ t('查看权限模型') }}
        </BkButton>
      </div>
      <BkInput
        v-model="keyword"
        class="search-input"
        clearable
        :placeholder="t('搜索用户名')"
        :right-icon="'bk-icon icon-search'"
      />
    </div>

    <AgTable
      v-model:table-data="displayMembers"
      local-page
      table-row-key="username"
      :show-settings="false"
      :max-limit-config="{ allocatedHeight: 220, mode: 'tdesign' }"
      :columns="columns"
      :table-empty-type="keyword ? 'search-empty' : 'empty'"
      @clear-filter="keyword = ''"
    />

    <AddMember
      v-model:is-show="isAddShow"
      :members="members"
      @done="fetchMembers"
    />
    <EditMember
      v-model:is-show="isChangeShow"
      :admin-count="adminCount"
      :member="changeMember"
      @done="fetchMembers"
    />
    <CheckPermissionModel
      v-model:is-show="isModelShow"
    />
  </div>
</template>

<script setup lang="tsx">
import { Message } from 'bkui-vue';
import { usePopInfoBox } from '@/hooks';
import {
  deleteGatewayMember,
  getGatewayMemberList,
} from '@/services/source/gateway-member';
import { useFeatureFlag, useUserInfo } from '@/stores';
import AgTable from '@/components/ag-table/Index.vue';
import type { PrimaryTableProps, TableRowData } from '@blueking/tdesign-ui';
import AddMember from './components/AddMember.vue';
import EditMember from './components/EditMember.vue';
import CheckPermissionModel from './components/CheckPermissionModel.vue';
import type { IMember } from './types';
import {
  getMemberDescription,
  getRoleLabel,
} from './utils';
import type { MemberRole } from '@/constants/gateway-permission';

type RoleTabKey = 'all' | MemberRole;

const { t } = useI18n();
const route = useRoute();
const userStore = useUserInfo();
const featureFlagStore = useFeatureFlag();

const keyword = ref('');
const activeRole = ref<RoleTabKey>('all');
const isAddShow = ref(false);
const isChangeShow = ref(false);
const isModelShow = ref(false);
const changeMember = ref<IMember>();
const members = ref<IMember[]>([]);
const displayMembers = ref<IMember[]>([]);

const apigwId = computed(() => Number(route.params.id));
const currentUsername = computed(() => userStore.info.username);
const adminCount = computed(() => members.value.filter(member => member.roles.includes('admin')).length);

const roleTabs = computed(() => [
  {
    key: 'all' as RoleTabKey,
    label: t('全部成员'),
    count: members.value.length,
  },
  {
    key: 'admin' as RoleTabKey,
    label: t('管理员'),
    count: members.value.filter(item => item.roles.includes('admin')).length,
  },
  {
    key: 'operator' as RoleTabKey,
    label: t('运营者'),
    count: members.value.filter(item => item.roles.includes('operator')).length,
  },
]);

const columns = computed<PrimaryTableProps['columns']>(() => [
  {
    title: t('用户名'),
    colKey: 'username',
    width: 220,
    cell: (_h: unknown, { row }: { row: TableRowData }) => {
      const member = row as unknown as IMember;
      return featureFlagStore.isEnableDisplayName
        ? <span><bk-user-display-name user-id={member.username} /></span>
        : <span>{member.username}</span>;
    },
  },
  {
    title: t('角色'),
    colKey: 'roles',
    width: 220,
    cell: (_h: unknown, { row }: { row: TableRowData }) => {
      const member = row as unknown as IMember;
      return (
        <div class="role-tags">
          {member.roles.map(role => (
            <bk-tag
              key={role}
              theme={role === 'admin' ? 'success' : 'warning'}
            >
              {getRoleLabel(role)}
            </bk-tag>
          ))}
        </div>
      );
    },
  },
  {
    title: t('权限描述'),
    colKey: 'description',
    ellipsis: true,
    cell: (_h: unknown, { row }: { row: TableRowData }) => {
      const member = row as unknown as IMember;
      return getMemberDescription(member.roles);
    },
  },
  {
    title: t('操作'),
    colKey: 'operation',
    width: 180,
    cell: (_h: unknown, { row }: { row: TableRowData }) => {
      const member = row as unknown as IMember;
      return (
        <div class="member-actions">
          <bk-button
            text
            theme="primary"
            onClick={() => handleChangeRole(member)}
          >
            {t('变更角色')}
          </bk-button>
          <bk-button
            text
            theme="primary"
            onClick={() => handleDelete(member)}
          >
            {t('删除成员')}
          </bk-button>
        </div>
      );
    },
  },
]);

watch(
  [members, activeRole, keyword],
  () => {
    displayMembers.value = members.value.filter((item) => {
      const matchRole = activeRole.value === 'all' || item.roles.includes(activeRole.value);
      const matchKeyword = !keyword.value || item.username.toLowerCase().includes(keyword.value.toLowerCase());
      return matchRole && matchKeyword;
    });
  },
  { immediate: true },
);

watch(apigwId, () => {
  fetchMembers();
});

const handleAdd = () => {
  isAddShow.value = true;
};

const handleViewPermissionModel = () => {
  isModelShow.value = true;
};

const fetchMembers = async () => {
  const { results } = await getGatewayMemberList(apigwId.value);
  members.value = results;
};

const isLastAdmin = (username: string, nextMembers: IMember[]) => {
  return !nextMembers.some(item => item.username !== username && item.roles.includes('admin'));
};

const confirmSelfLeaveAdmin = (onConfirm: () => Promise<void>) => {
  usePopInfoBox({
    isShow: true,
    type: 'warning',
    title: () => t('确认移除自己的管理员权限？'),
    subTitle: t('您已将自己从管理员列表中移除，移除后您将失去查看和编辑网关的权限。请确认！'),
    confirmText: t('确定'),
    cancelText: t('取消'),
    onConfirm,
  });
};

const handleChangeRole = (row: IMember) => {
  changeMember.value = row;
  isChangeShow.value = true;
};

const handleDelete = (row: IMember) => {
  const nextMembers = members.value.filter(item => item.username !== row.username);
  if (row.roles.includes('admin') && isLastAdmin(row.username, nextMembers)) {
    Message({
      theme: 'error',
      message: t('至少保留一名管理员'),
    });
    return;
  }

  const persist = async () => {
    await deleteGatewayMember(apigwId.value, row.username);
    await fetchMembers();
    Message({
      theme: 'success',
      message: t('删除成功'),
    });
  };

  usePopInfoBox({
    isShow: true,
    type: 'warning',
    title: () => t('确认删除成员？'),
    subTitle: t('删除后该成员将失去对应权限，请确认'),
    confirmText: t('删除'),
    cancelText: t('取消'),
    confirmButtonTheme: 'danger',
    onConfirm: () => {
      if (row.username === currentUsername.value && row.roles.includes('admin')) {
        confirmSelfLeaveAdmin(persist);
        return;
      }
      persist();
    },
  });
};

onMounted(fetchMembers);

</script>

<style lang="scss" scoped>
.member-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.search-input {
  width: 240px;
}

:deep(.role-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

:deep(.member-actions) {
  display: flex;
  gap: 16px;
}
</style>
