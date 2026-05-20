package com.vnu.uet.repository;

import com.vnu.uet.domain.Acl;
import com.vnu.uet.service.dto.AuthorizeDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data repository for the Acl entity.
 */
@SuppressWarnings("unused")
@Repository
public interface AclRepository extends JpaRepository<Acl, String> {

    @Query(value = " Select new  com.vnu.uet.service.dto.AuthorizeDto(authorize.orgIn, authorize.email) " +
            " From Acl  authorize " +
            " WHERE authorize.email = :username " +
            " AND authorize.orgIn = :orgIn " +
            " AND authorize.formId= :formId ")
    AuthorizeDto getAuthor(@Param("username") String username,
            @Param("orgIn") String orgIn,
            @Param("formId") String formId);

    // @Query(value = " Select new
    // com.vnu.uet.service.dto.AuthorizeDto(authorize.orgIn, GROUP_CONCAT(
    // authorize.email, true , ',') )" +
    // " From Acl authorize " +
    // " WHERE authorize.role = 2 " +
    // " AND authorize.formId= :formId " +
    // " group by authorize.orgIn"
    // )
    // List<AuthorizeDto> getInfoShare(@Param("formId") String formId);

    @Modifying
    @Query("DELETE FROM Acl acl " +
            "WHERE acl.formId = :formId " +
            "AND acl.email = :email " +
            "AND acl.orgIn = :orgIn " +
            "AND acl.role = 2")
    public void deleteByFormIdAndEmailAndOrgIn(@Param("formId") String formId,
            @Param("email") String email,
            @Param("orgIn") String orgIn);

    @Modifying
    public void deleteByFormId(@Param("formId") String formId);

    List<Acl> findAllByFormIdIn(List<String> formIds);
}
