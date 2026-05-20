package com.vnu.uet.utils;

import com.vnu.uet.domain.Form;
import com.vnu.uet.domain.Version;
import com.vnu.uet.request.FormIdListRequest;
import com.vnu.uet.search.FormSearchOwner;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;


public class FormSpecification {

    public static Specification<Form> buildSpec(FormIdListRequest request) {
        return (root, query, cb) -> {

            Root<Version> versionRoot = query.from(Version.class);

            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("formId"), versionRoot.get("formId")));
            predicates.add(cb.isTrue(versionRoot.get("active")));

            if (request.getFormIds() != null && !request.getFormIds().isEmpty()) {
                predicates.add(root.get("formId").in(request.getFormIds()));
            }

            if (request.getSearchText() != null && !request.getSearchText().isBlank()) {
                String likePattern = "%" + request.getSearchText().trim() + "%";
                Predicate nameLike = cb.like(root.get("formName"), likePattern);
                Predicate codeLike = cb.like(root.get("formCode"), likePattern);
                predicates.add(cb.or(nameLike, codeLike));
            }

            if (request.getCreatedDate() != null) {
                LocalDate date = request.getCreatedDate().atZone(ZoneOffset.UTC).toLocalDate();
                predicates.add(cb.between(root.get("createdDate"),
                    date.atStartOfDay().toInstant(ZoneOffset.UTC),
                    date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
            }



            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Form> forOwnerSearch(FormSearchOwner search, String orgIn) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search.getCreatedBy() != null && !search.getCreatedBy().isBlank()) {
                predicates.add(cb.equal(root.get("createdBy"), search.getCreatedBy()));
            }
            predicates.add(cb.equal(root.get("orgIn"), orgIn));

            if (search.getStatusFormList() != null && !search.getStatusFormList().isEmpty()) {
                predicates.add(root.get("statusForm").in(search.getStatusFormList()));
            }

            if (search.getBeginTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endTime"), search.getBeginTime()));
            }
            if (search.getEndTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("beginTime"), search.getEndTime()));
            }

            if (search.getBeginDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdDate"), search.getBeginDate()));
            }
            if (search.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdDate"), search.getEndDate()));
            }

            if (search.getFormName() != null && !search.getFormName().isBlank()) {
                String likePattern = "%" + search.getFormName().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("formName")), likePattern);
                Predicate tagLike = cb.like(cb.lower(root.get("tag")), likePattern);
                predicates.add(cb.or(nameLike, tagLike));
            } else if (search.getTag() != null && !search.getTag().isBlank()) {
                String likePattern = "%" + search.getTag().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("tag")), likePattern));
            }

            query.orderBy(cb.desc(root.get("createdDate")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
