package com.vnu.uet.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
@AllArgsConstructor
public enum StatusForm {
    DRAFT(1L),
    RELEASE(2L),
    WITHDRAW(3L),
    EDIT(4L);

    private Long value;

    private static final Map<Long, StatusForm> map = new HashMap<>();

    static {
        for (StatusForm perm : values()) {
            map.put(perm.value, perm);
        }
    }

}
