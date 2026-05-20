package com.vnu.uet.converter;

import java.time.*;
import java.time.format.DateTimeFormatter;

public class DateConverter {
    public static Instant parseStringToZonedDateTime(String dateString) {
        if (dateString == null || dateString.isEmpty()) return null;
        String normalizedDate = dateString.replace("-", "/").split(" ")[0];
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        LocalDate localDate = LocalDate.parse(normalizedDate, formatter);
        ZonedDateTime zonedDateTime = localDate.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh"));
        return zonedDateTime.toInstant();
    }

    public static ZonedDateTime parseStringToZonedDateTime2(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        return ZonedDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
    }

    public static Instant parseStringToZonedDateTime3(String dateString) {
        if (dateString == null || dateString.isEmpty()) return null;
        String normalizedDate = dateString.replace("-", "/").split(" ")[0];
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        LocalDate localDate = LocalDate.parse(normalizedDate, formatter);
        LocalDateTime endOfDay = localDate.atTime(23, 59, 59);
        ZonedDateTime zonedDateTime = endOfDay.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        return zonedDateTime.toInstant();
    }
}
