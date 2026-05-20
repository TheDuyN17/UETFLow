package com.vnu.uet.search;

import lombok.Data;

import java.time.Instant;

@Data
public class SearchVersion {
    public String formId;
    public int version;
    public Instant start;
    public Instant end;
    public int sort;
}
