# -*- coding: utf-8 -*-
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
from rest_framework import serializers

from apigateway.utils import time


class ResourceDocSLZ(serializers.Serializer):
    type = serializers.CharField()
    content = serializers.CharField()
    updated_time = serializers.SerializerMethodField()

    def get_updated_time(self, obj):
        if not obj.get("updated_time"):
            return ""

        updated_time = time.utctime(obj["updated_time"])
        return serializers.DateTimeField(allow_null=True, required=False).to_representation(updated_time)