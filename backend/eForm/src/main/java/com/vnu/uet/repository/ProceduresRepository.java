package com.vnu.uet.repository;

import com.vnu.uet.domain.Procedures;
import com.vnu.uet.service.dto.FormEflow;
import com.vnu.uet.service.dto.ProcedureDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Spring Data  repository for the Procedures entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ProceduresRepository extends JpaRepository<Procedures, String> {
    public void deleteByFormId(String formId);

    @Query(value = "Select distinct procedure.procedureId   " +
        "From Procedures  procedure " +
        "where procedure.formId = :formId " +
        "order by procedure.procedureId"
    )
    List<String> getProcedure(@Param("formId") String formId);

    @Query("SELECT p.formId, p.procedureName FROM Procedures p WHERE p.formId IN :formIds")
    List<Object[]> findProceduresByFormIdsIn(@Param("formIds") List<String> formIds);

    @Query(value = "Select new com.vnu.uet.service.dto.FormEflow(version.formId, version.formName, version.createdBy,  version.statusForm, version.createdDate, version.tag, version.beginTime, version.endTime, version.jsonForm, version.description, CASE when ( :current_time > version.beginTime AND :current_time < version.endTime ) then 'true' else 'false' end, procedure.versionId, version.versionName, version.formCode, version.jsonFormCondition, procedure.stepId ) " +
        "From Procedures  procedure " +
        "Join Version  version " +
        "On procedure.versionId = version.versionId " +
        "where procedure.procedureId = :procedures " +
        "And procedure.createdBy = :created_by " +
        "And procedure.orgIn = :orgIn "
    )
    List<FormEflow> findFormEflowByProcedure(@Param("procedures") String procedures,
                                             @Param("created_by") String created_by,
                                             @Param("current_time") Instant current_time,
                                             @Param("orgIn") String orgIn);

    @Query(value = "Select new com.vnu.uet.service.dto.FormEflow(version.formId, version.formName, version.createdBy,  version.statusForm, version.createdDate, version.tag, version.beginTime, version.endTime, version.jsonForm, version.description, CASE when ( :current_time > version.beginTime AND :current_time < version.endTime ) then 'true' else 'false' end, procedure.versionId, version.versionName, version.formCode, version.jsonFormCondition, procedure.stepId)" +
        "From Procedures  procedure " +
        "Join Version  version " +
        "On procedure.versionId = version.versionId " +
        "where procedure.stepId = :step " +
        "And procedure.createdBy = :created_by " +
        "And procedure.orgIn = :orgIn "
    )
    List<FormEflow> findFormEflowByStep(@Param("step") String step,
                                        @Param("created_by") String created_by,
                                        @Param("current_time") Instant current_time,
                                        @Param("orgIn") String orgIn);

    public void deleteByStepId(String stepId);

    public void deleteByProcedureIdAndStepId(String procedureId, String stepId);
    public void deleteByProcedureId(String procedureId);

    @Query(value = "DELETE FROM Procedures procedure " +
        "where procedure.formId = :formId " +
        "And procedure.createdBy = :created_by " +
        "And procedure.orgIn = :orgIn "
    )
    public void deleteByFormId(String formId, String createdBy, String orgIn);

    @Query(value = "Select new com.vnu.uet.service.dto.ProcedureDto(procedure.createdDate, procedure.procedureName, procedure.stepName, procedure.versionId, procedure.procedureId, procedure.stepId) " +
        "From Procedures  procedure " +
        "where procedure.formId = :formId " +
        "And procedure.procedureName like %:procedureName% " +
        "order by procedure.createdDate"
    )
    List<ProcedureDto> findListProcedureByFormId(@Param("formId") String formId,
                                                 @Param("procedureName") String procedureName);

    List<Procedures> findAllByFormIdIn(List<String> formIds);
}
