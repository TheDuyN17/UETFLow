package com.vnu.uet.service.dto;

import lombok.Data;

@Data
public class AuthorizeDto {
    public String orgIn;
    public String arrEmail;

    public AuthorizeDto(String orgIn, String emailList) {
        this.orgIn = orgIn;
        this.arrEmail = emailList;
    }
}
