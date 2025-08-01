# -*- coding: utf-8 -*-
#
# TencentBlueKing is pleased to support the open source community by making
# 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
# Copyright (C) 2025 Tencent. All rights reserved.
# Licensed under the MIT License (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://opensource.org/licenses/MIT
#
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the License for the specific language governing permissions and
# limitations under the License.
#
# We undertake not to change the open source license (MIT license) applicable
# to the current version of the project delivered to anyone in the future.
#
from typing import List

from django.conf import settings

from apigateway.apps.esb.exceptions import EsbGatewayNotFound
from apigateway.core.models import Gateway
from apigateway.utils.django import get_object_or_None


def get_related_boards(user_auth_type: str) -> List[str]:
    return settings.USER_AUTH_TYPE_CONFIGS[user_auth_type]["boards"]


def get_esb_gateway() -> Gateway:
    gateway = get_object_or_None(Gateway, name=settings.BK_ESB_GATEWAY_NAME)
    if not gateway:
        raise EsbGatewayNotFound(f"ESB gateway [name={settings.BK_ESB_GATEWAY_NAME}] not found")

    return gateway
