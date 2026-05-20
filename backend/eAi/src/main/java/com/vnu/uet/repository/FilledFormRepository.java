package com.vnu.uet.repository;

import com.vnu.uet.domain.FilledForm;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the FilledForm entity.
 */
@SuppressWarnings("unused")
@Repository
public interface FilledFormRepository extends JpaRepository<FilledForm, Long> {}
