package com.mycompany.erequest.web.filter;

import com.mycompany.erequest.client.EAccountClient;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Validates the opaque bearer token (issued by eAccount) by calling eAccount's
 * /api/internal/auth/validate-token endpoint and populates the SecurityContext.
 */
public class RemoteTokenAuthFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(RemoteTokenAuthFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final EAccountClient eAccountClient;

    public RemoteTokenAuthFilter(EAccountClient eAccountClient) {
        this.eAccountClient = eAccountClient;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                EAccountClient.TokenValidationResponseDTO resp = eAccountClient.validateToken(
                    new EAccountClient.TokenValidationRequestDTO(token)
                );
                if (resp != null && Boolean.TRUE.equals(resp.isValid()) && StringUtils.hasText(resp.email())) {
                    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(resp.email(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                LOG.debug("Token validation failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
