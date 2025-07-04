#
# TencentBlueKing is pleased to support the open source community by making
# 蓝鲸智云 - API 网关(BlueKing - APIGateway) available.
# Copyright (C) 2017 THL A29 Limited, a Tencent company. All rights reserved.
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

from django.conf import settings


def build_mcp_server_url(mcp_server_name: str) -> str:
    bk_apigateway_url = settings.BK_API_URL_TMPL.format(api_name="bk-apigateway")
    return f"{bk_apigateway_url}/prod/api/v2/mcp-servers/{mcp_server_name}/sse/"


def build_mcp_server_detail_url(mcp_server_id: int) -> str:
    return f"{settings.DASHBOARD_FE_URL}/mcp-market-details/{mcp_server_id}/"
