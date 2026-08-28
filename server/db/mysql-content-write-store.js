function createMysqlContentWriteStore({ ops }) {
  async function updateFields(tableName, idColumn, idValue, fields, fieldMap) {
    const entries = Object.entries(fieldMap)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(fields, key))
      .map(([key, column]) => [column, fields[key]])

    if (!entries.length) return

    const sql = `UPDATE ${tableName} SET ${entries.map(([column]) => `${column} = ?`).join(', ')} WHERE ${idColumn} = ?`
    await ops.run(sql, [...entries.map(([, value]) => value), String(idValue)])
  }

  return {
    async insertContent(content) {
      await ops.run(`
        INSERT INTO contents
          (id, module_key, category, tags_json, status, title, summary, sensitive_level, risk_types_json,
           current_version_id, published_version_id, workflow_id, current_step_id, created_by, updated_by,
           submitted_at, published_at, deleted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        content.id,
        content.moduleKey,
        content.category,
        content.tagsJson,
        content.status,
        content.title,
        content.summary,
        content.sensitiveLevel,
        content.riskTypesJson,
        content.currentVersionId,
        content.publishedVersionId,
        content.workflowId,
        content.currentStepId,
        content.createdBy,
        content.updatedBy,
        content.submittedAt,
        content.publishedAt,
        content.deletedAt,
        content.createdAt,
        content.updatedAt,
      ])
    },

    async updateContentFields(id, fields) {
      await updateFields('contents', 'id', id, fields, {
        moduleKey: 'module_key',
        category: 'category',
        tagsJson: 'tags_json',
        status: 'status',
        title: 'title',
        summary: 'summary',
        sensitiveLevel: 'sensitive_level',
        riskTypesJson: 'risk_types_json',
        currentVersionId: 'current_version_id',
        publishedVersionId: 'published_version_id',
        workflowId: 'workflow_id',
        currentStepId: 'current_step_id',
        createdBy: 'created_by',
        updatedBy: 'updated_by',
        submittedAt: 'submitted_at',
        publishedAt: 'published_at',
        deletedAt: 'deleted_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      })
    },

    async deleteContent(id) {
      await ops.run('DELETE FROM contents WHERE id = ?', [String(id)])
    },

    async insertContentVersion(version) {
      await ops.run(`
        INSERT INTO content_versions
          (id, content_id, version_number, title, summary, body, data_json, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        version.id,
        version.contentId,
        version.versionNumber,
        version.title,
        version.summary,
        version.body,
        version.dataJson,
        version.createdBy,
        version.createdAt,
      ])
    },

    async updateContentVersion(id, version) {
      await ops.run(`
        UPDATE content_versions
        SET title = ?, summary = ?, body = ?, data_json = ?, created_by = ?, created_at = ?
        WHERE id = ?
      `, [
        version.title,
        version.summary,
        version.body,
        version.dataJson,
        version.createdBy,
        version.createdAt,
        String(id),
      ])
    },

    async replaceContentSources(contentId, versionId, sources) {
      await ops.run('DELETE FROM content_sources WHERE content_id = ? AND version_id = ?', [String(contentId), String(versionId)])
      for (const source of sources) {
        await ops.run(`
          INSERT INTO content_sources
            (id, content_id, version_id, source_type, source_title, source_url, archive_ref, page_ref,
             collector, collected_at, trust_level, attachment_media_id, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          source.id,
          contentId,
          versionId,
          source.sourceType,
          source.sourceTitle,
          source.sourceUrl,
          source.archiveRef,
          source.pageRef,
          source.collector,
          source.collectedAt,
          source.trustLevel,
          source.attachmentMediaId,
          source.notes,
          source.createdAt,
        ])
      }
    },

    async insertReviewTask(task) {
      await ops.run(`
        INSERT INTO content_review_tasks
          (id, content_id, version_id, workflow_id, step_id, status, assignee_role_id,
           reviewer_id, comment, created_at, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id,
        task.contentId,
        task.versionId,
        task.workflowId,
        task.stepId,
        task.status,
        task.assigneeRoleId,
        task.reviewerId,
        task.comment,
        task.createdAt,
        task.reviewedAt,
      ])
    },

    async updateReviewTaskFields(id, fields) {
      await updateFields('content_review_tasks', 'id', id, fields, {
        status: 'status',
        assigneeRoleId: 'assignee_role_id',
        reviewerId: 'reviewer_id',
        comment: 'comment',
        createdAt: 'created_at',
        reviewedAt: 'reviewed_at',
      })
    },

    async cancelPendingReviewTasks(contentId) {
      await ops.run("UPDATE content_review_tasks SET status = 'cancelled' WHERE content_id = ? AND status = 'pending'", [String(contentId)])
    },

    async insertMediaAsset(asset) {
      await ops.run(`
        INSERT INTO media_assets
          (id, original_name, stored_name, media_type, mime_type, extension, size_bytes, width, height, duration_seconds,
           category, alt_text, caption, original_url, url, thumbnail_url, original_storage_path, storage_path,
           checksum_sha256, watermark_text, auto_compress, processing_status, processing_note, uploaded_by,
           deleted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        asset.id,
        asset.originalName,
        asset.storedName,
        asset.mediaType,
        asset.mimeType,
        asset.extension,
        asset.sizeBytes,
        asset.width,
        asset.height,
        asset.durationSeconds,
        asset.category,
        asset.altText,
        asset.caption,
        asset.originalUrl,
        asset.url,
        asset.thumbnailUrl,
        asset.originalStoragePath,
        asset.storagePath,
        asset.checksumSha256,
        asset.watermarkText,
        asset.autoCompress,
        asset.processingStatus,
        asset.processingNote,
        asset.uploadedBy,
        asset.deletedAt,
        asset.createdAt,
        asset.updatedAt,
      ])
    },

    async updateMediaAssetFields(id, fields) {
      await updateFields('media_assets', 'id', id, fields, {
        category: 'category',
        altText: 'alt_text',
        caption: 'caption',
        watermarkText: 'watermark_text',
        autoCompress: 'auto_compress',
        deletedAt: 'deleted_at',
        updatedAt: 'updated_at',
      })
    },

    async deleteMediaAsset(id) {
      await ops.run('DELETE FROM media_assets WHERE id = ?', [String(id)])
    },
  }
}

module.exports = {
  createMysqlContentWriteStore,
}
