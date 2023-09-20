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

import json

from django import forms

from common.constants import API_TYPE_Q, HTTP_METHOD
from common.forms import BaseComponentForm, TypeCheckField
from components.component import Component
from .toolkit import configs, tools


class SearchModule(Component):
    suggest_method = HTTP_METHOD.POST
    label = u"查询模块"
    label_en = "search module"

    sys_name = configs.SYSTEM_NAME
    api_type = API_TYPE_Q

    host = configs.host

    class Form(BaseComponentForm):
        bk_supplier_account = forms.CharField(label="bk supplier account", required=False)
        bk_biz_id = forms.IntegerField(label="business id", required=True)
        bk_set_id = forms.IntegerField(label="set id", required=False)
        fields = TypeCheckField(label="fields", promise_type=list, required=False)
        condition = TypeCheckField(label="condition", promise_type=dict, required=False)
        page = TypeCheckField(label="page", promise_type=dict, required=False)

        def clean(self):
            data = self.get_cleaned_data_when_exist(keys=["bk_biz_id"])
            data["data"] = self.get_cleaned_data_when_exist(keys=["bk_set_id", "fields", "condition", "page"])
            return data

    def handle(self):
        client = tools.CCClient(self)
        self.response.payload = client.post(
            host=self.host,
            path="/api/v3/findmany/module/biz/{bk_biz_id}".format(**self.form_data),
            data=json.dumps(self.form_data["data"]),
        )
