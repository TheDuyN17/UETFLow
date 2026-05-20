package com.vnu.uet.repository;

import com.vnu.uet.domain.Form;
import com.vnu.uet.search.FormSearchOwner;
import com.vnu.uet.search.FormSearchOwnerExcel;
import com.vnu.uet.search.FormSearchShare;
import com.vnu.uet.service.dto.FormDto;
import com.vnu.uet.service.dto.FormShareDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Spring Data repository for the Form entity.
 */
@SuppressWarnings("unused")
@Repository
public interface FormRepository extends JpaRepository<Form, String>, JpaSpecificationExecutor<Form> {
    boolean existsByFormId(String formId);

    Form findFormByFormId(String idForm);

    @Query(value = " Select new com.vnu.uet.service.dto.FormDto(form.formId, form.formName, form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.lastModifiedDate, form.jsonForm, form.description, form.formCode, form.jsonFormCondition, form.createdBy, form.userId, form.orgIn, form.custId, form.codeJson, form.configWriter) "
            +
            " From Form  form " +
            " WHERE form.createdBy = :#{#formSearchOwner.createdBy} " +
            " And form.orgIn = :orgIn" +
            " AND (:#{#formSearchOwner.statusForm} = null or form.statusForm = :#{#formSearchOwner.statusForm} )" +
            " AND (:#{#formSearchOwner.beginTime} = null  or (form.beginTime >= :#{#formSearchOwner.beginTime} AND form.endTime >= :#{#formSearchOwner.beginTime})) "
            +
            " AND (:#{#formSearchOwner.endTime} = null  or (form.endTime <= :#{#formSearchOwner.endTime} AND form.beginTime <= :#{#formSearchOwner.endTime})) "
            +
            " AND (:#{#formSearchOwner.beginDate} = null  or form.createdDate >= :#{#formSearchOwner.beginDate}) " +
            " AND (:#{#formSearchOwner.endDate} = null  or form.createdDate <= :#{#formSearchOwner.endDate})" +
            " AND (:#{#formSearchOwner.formName} = null or :#{#formSearchOwner.formName} = '' or form.formName like %:#{#formSearchOwner.formName}% or form.tag like %:#{#formSearchOwner.tag}% ) "
            +
            " order by form.createdDate DESC ")
    List<FormDto> findFormOwnerByFilterExcell(@Param("formSearchOwner") FormSearchOwnerExcel formSearchOwner,
            @Param("orgIn") String orgIn);

    @Query(value = " Select new com.vnu.uet.service.dto.FormDto(form.formId, form.formName, form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.lastModifiedDate, form.description, form.formCode, form.createdBy, form.userId, form.orgIn, form.custId, form.configWriter) "
            +
            " From Form  form " +
            " WHERE form.createdBy = :#{#formSearchOwner.createdBy} " +
            " And form.orgIn = :orgIn" +
            " AND (:#{#formSearchOwner.statusForm} = null or form.statusForm = :#{#formSearchOwner.statusForm} )" +
            " AND (:#{#formSearchOwner.beginTime} = null  or (form.beginTime >= :#{#formSearchOwner.beginTime} AND form.endTime >= :#{#formSearchOwner.beginTime})) "
            +
            " AND (:#{#formSearchOwner.endTime} = null  or (form.endTime <= :#{#formSearchOwner.endTime} AND form.beginTime <= :#{#formSearchOwner.endTime})) "
            +
            " AND (:#{#formSearchOwner.beginDate} = null  or form.createdDate >= :#{#formSearchOwner.beginDate}) " +
            " AND (:#{#formSearchOwner.endDate} = null  or form.createdDate <= :#{#formSearchOwner.endDate})" +
            " AND (:#{#formSearchOwner.formName} = null or :#{#formSearchOwner.formName} = '' or form.formName like %:#{#formSearchOwner.formName}% or form.tag like %:#{#formSearchOwner.tag}% ) "
            +
            " order by form.createdDate DESC ")
    Page<FormDto> findFormOwnerByFilter(@Param("formSearchOwner") FormSearchOwner formSearchOwner,
            @Param("orgIn") String orgIn, Pageable pageable);

    @Query(value = "Select new com.vnu.uet.service.dto.FormShareDto(form.formId, form.formName, form.createdBy,  form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.jsonForm, form.description, form.formCode, form.variableArr, form.jsonFormCondition, form.codeJson, form.configWriter) "
            +
            " From Acl author " +
            " Join Form  form " +
            " On author.formId = form.formId " +
            " WHERE author.email = :#{#formSearchShare.username} " +
            " AND author.role = 2 " +
            " AND author.orgIn = :orgIn " +
            " AND (:#{#formSearchShare.beginTime} = null  or (form.beginTime >= :#{#formSearchShare.beginTime} AND form.endTime >= :#{#formSearchShare.beginTime})) "
            +
            " AND (:#{#formSearchShare.endTime} = null  or (form.endTime <= :#{#formSearchShare.endTime} AND form.beginTime <= :#{#formSearchShare.endTime})) "
            +
            " AND (:#{#formSearchShare.beginDate} = null  or form.createdDate >= :#{#formSearchShare.beginDate}) " +
            " AND (:#{#formSearchShare.endDate} = null  or form.createdDate <= :#{#formSearchShare.endDate})" +
            " AND ( ( :#{#formSearchShare.formName} = null ) or ( :#{#formSearchShare.formName} = '' ) or ( form.formName like %:#{#formSearchShare.formName}% ) or ( form.tag like %:#{#formSearchShare.tag}% ) or( form.createdBy like %:#{#formSearchShare.formName}% ) ) "
            +
            " AND ( ( :#{#formSearchShare.createdByList} = null ) or  ( :#{#formSearchShare.createdByList} = '' ) or ( form.createdBy in :#{#formSearchShare.createdByList} )  ) "
            +
            " order by form.createdDate DESC ")
    List<FormShareDto> findFormShareExcell(@Param("formSearchShare") FormSearchShare formSearchShare,
            @Param("orgIn") String orgIn);

    @Query(value = "Select new com.vnu.uet.service.dto.FormShareDto(form.formId, form.formName, form.createdBy,  form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.description, form.formCode, form.variableArr, form.jsonFormCondition, form.codeJson, form.configWriter) "
            +
            " From Acl author " +
            " Join Form  form " +
            " On author.formId = form.formId " +
            " WHERE author.email = :#{#formSearchShare.username} " +
            " AND author.role = 2 " +
            " AND author.orgIn = :orgIn " +
            " AND ( (form.statusForm = :#{#formSearchShare.statusForm}) or (:#{#formSearchShare.statusForm} = 0L) ) " +
            " AND (:#{#formSearchShare.beginTime} = null  or (form.beginTime >= :#{#formSearchShare.beginTime} AND form.endTime >= :#{#formSearchShare.beginTime})) "
            +
            " AND (:#{#formSearchShare.endTime} = null  or (form.endTime <= :#{#formSearchShare.endTime} AND form.beginTime <= :#{#formSearchShare.endTime})) "
            +
            " AND (:#{#formSearchShare.beginDate} = null  or form.createdDate >= :#{#formSearchShare.beginDate}) " +
            " AND (:#{#formSearchShare.endDate} = null  or form.createdDate <= :#{#formSearchShare.endDate})" +
            " AND ( ( :#{#formSearchShare.formName} = null ) or ( :#{#formSearchShare.formName} = '' ) or ( form.formName like %:#{#formSearchShare.formName}% ) or ( form.tag like %:#{#formSearchShare.tag}% ) or( form.createdBy like %:#{#formSearchShare.formName}% ) ) "
            +
            " AND ( (:#{#formSearchShare.createdByList} = null)  ) " +
            " order by form.createdDate DESC ")
    Page<FormShareDto> findAllFormShare(@Param("formSearchShare") FormSearchShare formSearchShare,
            @Param("orgIn") String orgIn, Pageable pageable);

    @Query(value = "Select new com.vnu.uet.service.dto.FormShareDto(form.formId, form.formName, form.createdBy,  form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.description, form.formCode, form.variableArr, form.jsonFormCondition, form.codeJson, form.configWriter) "
            +
            " From Acl author " +
            " Join Form  form " +
            " On author.formId = form.formId " +
            " WHERE author.email = :#{#formSearchShare.username} " +
            " AND author.role = 2 " +
            " AND author.orgIn = :orgIn " +
            " AND ( form.statusForm = :#{#formSearchShare.statusForm} or :#{#formSearchShare.statusForm} = 0L ) " +
            " AND (:#{#formSearchShare.beginTime} = null  or (form.beginTime >= :#{#formSearchShare.beginTime} AND form.endTime >= :#{#formSearchShare.beginTime})) "
            +
            " AND (:#{#formSearchShare.endTime} = null  or (form.endTime <= :#{#formSearchShare.endTime} AND form.beginTime <= :#{#formSearchShare.endTime})) "
            +
            " AND (:#{#formSearchShare.beginDate} = null  or form.createdDate >= :#{#formSearchShare.beginDate}) " +
            " AND (:#{#formSearchShare.endDate} = null  or form.createdDate <= :#{#formSearchShare.endDate})" +
            " AND ( ( :#{#formSearchShare.formName} = null ) or ( :#{#formSearchShare.formName} = '' ) or ( form.formName like %:#{#formSearchShare.formName}% ) or ( form.tag like %:#{#formSearchShare.tag}% ) or( form.createdBy like %:#{#formSearchShare.formName}% ) ) "
            +
            " AND form.userId in :#{#formSearchShare.createdByList} " +
            " order by form.createdDate DESC ")
    Page<FormShareDto> findFormShare(@Param("formSearchShare") FormSearchShare formSearchShare,
            @Param("orgIn") String orgIn, Pageable pageable);

    @Query(value = " Select new com.vnu.uet.service.dto.FormShareDto(form.formId, form.formName, form.createdBy,  form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.jsonForm, form.description, form.formCode, version.versionId, form.variableArr, version.jsonFormCondition, form.codeJson , form.configWriter) "
            +
            "From Form  form " +
            "Join Acl  author " +
            "ON author.formId = form.formId " +
            "Join Version version " +
            "On form.formId = version.formId " +
            "WHERE author.email = :username " +
            " AND version.active = true " +
            " AND (form.statusForm = 2 OR form.statusForm = 4) " +
            " AND author.orgIn = :orgIn " +
            " AND (:createdDate1 = null  or form.createdDate >= :createdDate1) " +
            " AND (:createdDate2 = null  or form.createdDate <= :createdDate2) " +
            " AND form.beginTime < :currentTime " +
            " AND form.endTime > :currentTime " +
            " AND ((:textSearch = null or form.formName like %:textSearch% or form.formCode like %:textSearch%) ) " +
            " order by form.createdDate DESC ")
    Page<FormShareDto> findFormEflow(@Param("currentTime") Instant currentTime,
            @Param("createdDate1") Instant createdDate1,
            @Param("createdDate2") Instant createdDate2,
            @Param("textSearch") String textSearch,
            @Param("username") String username,
            @Param("orgIn") String orgIn, Pageable pageable);

    @Query(value = " Select new com.vnu.uet.service.dto.FormShareDto(version.formId, version.formName, version.createdBy,  version.statusForm, version.createdDate, version.tag, version.beginTime, version.endTime, version.jsonForm, version.description, version.formCode, version.versionId, version.variableArr, version.jsonFormCondition,version.codeJson , version.configWriter) "
            +
            "From Version  version " +
            "where version.versionId = :versionId ")
    FormShareDto findFormErequest(@Param("versionId") String versionId);

    @Query(value = " Select new com.vnu.uet.service.dto.FormShareDto(version.formId, version.formName, version.createdBy,  version.statusForm, version.createdDate, version.tag, version.beginTime, version.endTime, version.jsonForm, version.description, version.formCode, version.versionId, version.variableArr, version.jsonFormCondition, version.codeJson , version.configWriter) "
            +
            "From Version  version " +
            "where version.versionId in :versionIds ")
    List<FormShareDto> findFormErequestList(@Param("versionIds") List<String> versionIds);

    @Query(value = " Select new com.vnu.uet.service.dto.FormDto(form.formId, form.formName, form.statusForm, form.createdDate, form.tag, form.beginTime, form.endTime, form.lastModifiedDate, form.jsonForm, form.description, form.formCode, form.jsonFormCondition, form.createdBy, form.userId, form.orgIn, form.custId, form.codeJson, form.configWriter) "
            +
            " From Form  form " +
            " WHERE DATE(form.endTime) = CURRENT_DATE - 1")
    List<FormDto> findFormOverdue();

    List<Form> findByFormIdIn(List<String> formIds);

    @Query("SELECT new com.vnu.uet.service.dto.FormShareDto(" +
            " f.formId, f.formName, f.createdBy, f.statusForm, f.createdDate, f.tag, " +
            " f.beginTime, f.endTime, f.jsonForm, f.description, f.formCode, v.versionId, " +
            " f.variableArr, v.jsonFormCondition, f.codeJson, f.configWriter) " +
            " FROM Form f " +
            " JOIN Version v ON f.formId = v.formId AND v.active = true " +
            " WHERE (:formIds IS NULL OR f.formId IN :formIds) " +
            " AND (:formName IS NULL OR :formName = '' OR f.formName LIKE CONCAT('%', :formName, '%')) " +
            " AND (:formCodes IS NULL OR f.formCode IN :formCodes) " +
            " AND (:createdDate IS NULL OR f.createdDate = :createdDate) " +
            " ORDER BY f.createdDate DESC")
    Page<FormShareDto> findByFormIdInWithVersion(
            @Param("formIds") List<String> formIds,
            @Param("formName") String formName,
            @Param("formCodes") List<String> formCodes,
            @Param("createdDate") Instant createdDate,
            Pageable pageable);

}
