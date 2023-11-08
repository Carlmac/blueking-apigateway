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
import os
from tempfile import TemporaryDirectory

from bkapi_client_generator import generate_markdown
from jinja2 import FileSystemLoader
from jinja2.exceptions import TemplateNotFound, TemplatesNotFound, TemplateSyntaxError
from jinja2.sandbox import SandboxedEnvironment

from apigateway.apps.support.constants import DocLanguageEnum
from apigateway.biz.resource_doc.exceptions import (
    ResourceDocJinja2TemplateError,
    ResourceDocJinja2TemplateNotFound,
    ResourceDocJinja2TemplateSyntaxError,
)
from apigateway.utils.file import read_file, write_to_file


class Jinja2ToMarkdownGenerator:
    """根据 Jinja2 模版文件，生成 markdown 格式文档"""

    def __init__(self, filename: str, filepath: str):
        self.filename = filename
        self.filepath = filepath

    def generate_doc_content(self) -> str:
        if self._is_jinja2_template():
            return self._render_jinja2_template()

        return read_file(self.filepath).decode()

    def _is_jinja2_template(self) -> bool:
        return self.filepath.endswith(".md.j2")

    def _render_jinja2_template(self) -> str:
        env = SandboxedEnvironment(loader=FileSystemLoader(os.path.dirname(self.filepath)))
        try:
            template = env.get_template(os.path.basename(self.filepath))
            return template.render()
        except TemplateSyntaxError as err:
            raise ResourceDocJinja2TemplateSyntaxError(self._base_path, self.filename, err)
        except (TemplateNotFound, TemplatesNotFound) as err:
            raise ResourceDocJinja2TemplateNotFound(self.filename, err)
        except Exception as err:
            raise ResourceDocJinja2TemplateError(self.filename, err)

    @property
    def _base_path(self) -> str:
        """文档目录地址，如：/tmp/xxx，此目录下为文档语言目录"""
        return self.filepath[: -len(self.filename)]


class SwaggerToMarkdownGenerator:
    """根据 swagger 生成 markdown 格式文档"""

    def __init__(self, swagger: str, language: DocLanguageEnum):
        self.swagger = swagger
        self.language = language

    def generate_doc_content(self) -> str:
        if not self.swagger:
            return ""

        with TemporaryDirectory() as output_dir:
            swagger_filepath = os.path.join(output_dir, "swagger.yaml")
            write_to_file(self.swagger, swagger_filepath)
            doc_filepath = generate_markdown(
                swagger=swagger_filepath,
                language=self.language.value,
                output=os.path.join(output_dir, "docs.md"),
            )
            return read_file(doc_filepath).decode().strip()