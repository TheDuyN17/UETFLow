package com.vnu.uet.repository;

import com.vnu.uet.domain.Form;
import com.vnu.uet.domain.Version;

import com.vnu.uet.search.SearchVersion;
import com.vnu.uet.service.dto.VersionDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Spring Data  repository for the Version entity.
 */
@SuppressWarnings("unused")
@Repository
public interface VersionRepository extends JpaRepository<Version, String> {

    boolean existsByFormId(String formId);
    @Modifying
    public void deleteByFormId(@Param("formId") String formId);
    List<Version> findVersionByFormId(String formId);
    Version findVersionByVersionId(String versionId);
    Version findVersionByActiveAndFormId(Boolean active, String formId);

    Version findVersionByVersionNameAndFormId(String versionName, String formId);

    Version findVersionByFormIdAndActive(String formId, boolean active);

    @Query(value ="Select new com.vnu.uet.service.dto.VersionDto(version.versionId, version.createdDate, version.action, version.jsonForm, version.active, version.versionName, version.lastModifiedDate, form.statusForm, version.formCode, version.jsonFormCondition, version.codeJson, version.configWriter) " +
        "From Version version " +
        "Join Form form " +
        "On version.formId=form.formId " +
        "WHERE version.formId = :#{#searchVersion.formId} " +
        "AND (:#{#searchVersion.start} = null or version.createdDate >= :#{#searchVersion.start} ) " +
        "AND (:#{#searchVersion.end} = null or version.createdDate <= :#{#searchVersion.end}) " +
        "Order by version.createdDate DESC "
    )
    List<VersionDto> findVersionList(@Param("searchVersion") SearchVersion searchVersion);

    @Query(value ="Select new com.vnu.uet.service.dto.VersionDto(version.versionId, version.createdDate, version.action, version.jsonForm, version.active, version.versionName, version.lastModifiedDate, form.statusForm, version.formCode, version.jsonFormCondition, version.codeJson, version.configWriter) " +
        "From Version version " +
        "Join Form form " +
        "On version.formId=form.formId " +
        "WHERE version.formId = :#{#searchVersion.formId} " +
        "AND (:#{#searchVersion.start} = null or version.createdDate >= :#{#searchVersion.start} ) " +
        "AND (:#{#searchVersion.end} = null or version.createdDate <= :#{#searchVersion.end}) " +
        "Order by version.createdDate ASC "
    )
    List<VersionDto> findVersionSort1(@Param("searchVersion") SearchVersion searchVersion);

    @Query(value ="Select new com.vnu.uet.service.dto.VersionDto(version.versionId, version.createdDate, version.action, version.jsonForm, version.active, version.versionName, version.lastModifiedDate, form.statusForm, version.formCode, version.jsonFormCondition, version.codeJson, version.configWriter) " +
        "From Version version " +
        "Join Form form " +
        "On version.formId=form.formId " +
        "WHERE version.formId = :#{#searchVersion.formId} " +
        "AND (:#{#searchVersion.start} = null or version.createdDate >= :#{#searchVersion.start} ) " +
        "AND (:#{#searchVersion.end} = null or version.createdDate <= :#{#searchVersion.end}) " +
        "Order by version.createdDate DESC "
    )
    Page<VersionDto> findVersion(@Param("searchVersion") SearchVersion searchVersion, Pageable pageable);

    @Query(value ="Select new com.vnu.uet.service.dto.VersionDto(version.versionId, version.createdDate, version.action, version.jsonForm, version.active, version.versionName, version.lastModifiedDate, form.statusForm, version.formCode, version.jsonFormCondition, version.codeJson, version.configWriter) " +
        "From Version version " +
        "Join Form form " +
        "On version.formId=form.formId " +
        "WHERE version.formId = :#{#searchVersion.formId} " +
        "AND (:#{#searchVersion.start} = null or version.createdDate >= :#{#searchVersion.start} ) " +
        "AND (:#{#searchVersion.end} = null or version.createdDate <= :#{#searchVersion.end}) " +
        "Order by version.createdDate ASC "
    )
    Page<VersionDto> findVersionSort(@Param("searchVersion") SearchVersion searchVersion, Pageable pageable);

    List<Version> findAllByFormIdIn(List<String> formIds);

    List<Version> findByActiveTrueAndFormIdIn(Collection<String> formId);
}
