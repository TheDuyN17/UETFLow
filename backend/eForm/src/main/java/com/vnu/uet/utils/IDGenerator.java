package com.vnu.uet.utils;

import com.vnu.uet.config.WorkerInstance;
import com.vnu.uet.security.SecurityUtils;
import com.vnu.uet.security.UserInFoDetails;
import org.apache.commons.lang3.StringUtils;
import org.hashids.Hashids;

import java.util.concurrent.atomic.AtomicLong;

public class IDGenerator {
    private static AtomicLong atomicLong = new AtomicLong();

    public static String generate(long... numbers) {
        long[] newNumbers;
        if (numbers != null) {
            newNumbers = new long[numbers.length + 3];
            System.arraycopy(numbers, 0, newNumbers, 3, numbers.length);
        } else {
            newNumbers = new long[3];
        }
        newNumbers[0] = 1;
        newNumbers[1] = atomicLong.getAndIncrement();
        newNumbers[2] = System.currentTimeMillis();

        Hashids hashIds = new Hashids("This is salt");
        return 1 + hashIds.encode(newNumbers);
    }

    public static String generateIDSuffix(Long userId) {
        UserInFoDetails userInfo = SecurityUtils.getInfoCurrentUserLogin();
        return userInfo != null && StringUtils.isNotBlank(userInfo.getOrgId())
                ? userInfo.getOrgId() + generate(userId)
                : "0001" + generate(userId);
    }

    public String generateKey(long... numbers) {
        long[] newNumbers;
        if (numbers != null) {
            newNumbers = new long[numbers.length + 2];
            System.arraycopy(numbers, 0, newNumbers, 2, numbers.length);
        } else {
            newNumbers = new long[2];
        }
        newNumbers[0] = this.atomicLong.getAndIncrement();
        newNumbers[1] = System.currentTimeMillis();
        Hashids hashIds = new Hashids("This is salt FPT");
        return hashIds.encode(newNumbers);
    }
}
