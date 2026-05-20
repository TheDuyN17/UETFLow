package com.vnu.uet.config;

import java.io.Serializable;

public class WorkerInstance implements Serializable {

    /**
     *
     */
    private static final long serialVersionUID = 1L;

    private static Integer id;

    private static Long _id;

    public static Integer getInstaceId() {
        return id;
    }

    public static Long getId() {
        return _id;
    }

    synchronized public static void createId(Long _instance) {
        _id = _instance;
    }

    synchronized public static void createInstanceId(Integer instance) {
        id = instance;
    }

}
