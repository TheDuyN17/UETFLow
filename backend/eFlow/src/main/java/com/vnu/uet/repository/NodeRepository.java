package com.vnu.uet.repository;

import com.vnu.uet.domain.Node;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {

    @Query("SELECT n FROM Node n WHERE n.flow.id = :flowId AND n.nodeType = :nodeType")
    List<Node> findAllByFlowIdAndNodeType(@Param("flowId") Long flowId, @Param("nodeType") String nodeType);

    @Query("SELECT n FROM Node n WHERE n.flow.id = :flowId")
    List<Node> findAllByFlowId(@Param("flowId") Long flowId);
}
