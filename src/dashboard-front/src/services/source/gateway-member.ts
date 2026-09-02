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

import type { IGatewayMemberUpdateInputSLZ } from '@/services/types/body/patch/gateway-members';
import type { IGatewayMemberCreateInputSLZ } from '@/services/types/body/post/gateway-members';
import type { IGatewayMemberOutput } from '@/services/types/responses/gateway-members';
import type { ICountAndResults } from '@/services/types/utils';

const DEFAULT_MEMBERS: IGatewayMemberOutput[] = [
  {
    username: 'admin',
    roles: ['admin'],
  },
  {
    username: 'alice',
    roles: ['admin'],
  },
  {
    username: 'bob',
    roles: ['operator'],
  },
];

const MEMBER_SEEDS: Record<number, IGatewayMemberOutput[]> = {
  1: DEFAULT_MEMBERS,
  2: [
    {
      username: 'admin',
      roles: ['admin'],
    },
  ],
  3: [
    {
      username: 'alice',
      roles: ['admin'],
    },
    {
      username: 'admin',
      roles: ['operator'],
    },
    {
      username: 'bob',
      roles: ['operator'],
    },
  ],
};

const membersByGateway = new Map<number, IGatewayMemberOutput[]>();

// 后端成员接口就绪前，将临时数据和增删改行为收口在 service 层。
const cloneMember = (member: IGatewayMemberOutput): IGatewayMemberOutput => ({
  ...member,
  roles: [...member.roles],
});

const getMembers = (apigwId: number) => {
  if (!membersByGateway.has(apigwId)) {
    const seed = MEMBER_SEEDS[apigwId] || DEFAULT_MEMBERS;
    membersByGateway.set(apigwId, seed.map(cloneMember));
  }
  return membersByGateway.get(apigwId)!;
};

// GET /gateways/{gateway_id}/members/
export function getGatewayMemberList(apigwId: number): Promise<ICountAndResults<IGatewayMemberOutput>> {
  const members = getMembers(apigwId);
  return Promise.resolve({
    count: members.length,
    results: members.map(cloneMember),
  });
}

// POST /gateways/{gateway_id}/members/
export function createGatewayMembers(
  apigwId: number,
  data: IGatewayMemberCreateInputSLZ,
): Promise<IGatewayMemberOutput[]> {
  const members = getMembers(apigwId);
  const existingUsernames = new Set(members.map(member => member.username));
  const createdMembers = data.usernames
    .filter((username) => {
      if (existingUsernames.has(username)) {
        return false;
      }
      existingUsernames.add(username);
      return true;
    })
    .map(username => ({
      username,
      roles: [data.role],
    }));

  members.push(...createdMembers);
  return Promise.resolve(createdMembers.map(cloneMember));
}

// PATCH /gateways/{gateway_id}/members/{username}/
export function updateGatewayMember(
  apigwId: number,
  username: string,
  data: IGatewayMemberUpdateInputSLZ,
): Promise<IGatewayMemberOutput> {
  const member = getMembers(apigwId).find(item => item.username === username);
  if (!member) {
    return Promise.reject(new Error('Gateway member not found.'));
  }

  member.roles = [data.role];
  return Promise.resolve(cloneMember(member));
}

// DELETE /gateways/{gateway_id}/members/{username}/
export function deleteGatewayMember(apigwId: number, username: string): Promise<void> {
  const members = getMembers(apigwId);
  const memberIndex = members.findIndex(member => member.username === username);
  if (memberIndex !== -1) {
    members.splice(memberIndex, 1);
  }
  return Promise.resolve();
}
