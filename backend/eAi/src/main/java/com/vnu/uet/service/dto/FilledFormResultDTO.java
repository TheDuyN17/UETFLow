package com.vnu.uet.service.dto;

public class FilledFormResultDTO {
    private String formName;
    private String filledData; // JSON String
    private Double confidence;
    private String missingFields;

    public FilledFormResultDTO() {}

    public String getFormName() { return formName; }
    public void setFormName(String formName) { this.formName = formName; }

    public String getFilledData() { return filledData; }
    public void setFilledData(String filledData) { this.filledData = filledData; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getMissingFields() { return missingFields; }
    public void setMissingFields(String missingFields) { this.missingFields = missingFields; }
}
