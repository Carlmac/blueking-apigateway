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

package dao

import (
	"context"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"

	"core/pkg/database"
)

func Test_stageManager_GetByName(t *testing.T) {
	database.RunWithMock(t, func(db *sqlx.DB, mock sqlmock.Sqlmock, t *testing.T) {
		mockQuery := `^SELECT id, name FROM core_stage`

		id := int64(1)
		name := "name"

		gatewayID := int64(2)

		record := Stage{
			ID:   id,
			Name: name,
		}

		mockData := []interface{}{
			record,
		}
		mockRows := database.NewMockRows(mock, mockData...)

		mock.ExpectQuery(mockQuery).WithArgs(gatewayID, name).WillReturnRows(mockRows)

		manager := &stageManager{DB: db}
		p, err := manager.GetByName(context.Background(), gatewayID, name)

		assert.NoError(t, err, "query from db fail.")
		assert.Equal(t, record, p)
	})
}
