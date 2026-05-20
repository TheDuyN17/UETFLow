//package com.vnu.uet.config;
//
//import org.springframework.beans.BeansException;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Qualifier;
//import org.springframework.context.ApplicationContext;
//import org.springframework.context.ApplicationContextAware;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.core.io.ClassPathResource;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
//import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
//import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
//import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
//import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
//import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
//import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
//import org.springframework.security.oauth2.config.annotation.web.configurers.ResourceServerSecurityConfigurer;
//import org.springframework.security.oauth2.provider.token.TokenEnhancer;
//import org.springframework.security.oauth2.provider.token.TokenEnhancerChain;
//import org.springframework.security.oauth2.provider.token.TokenStore;
//import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
//import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;
//import org.springframework.security.oauth2.provider.token.store.KeyStoreKeyFactory;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import org.springframework.web.filter.CorsFilter;
//
//import javax.servlet.http.HttpServletResponse;
//import javax.sql.DataSource;
//import java.security.KeyPair;
//import java.util.ArrayList;
//import java.util.Collection;
//
//@Configuration
//@EnableAuthorizationServer
//public class UaaConfiguration extends AuthorizationServerConfigurerAdapter implements ApplicationContextAware {
//	/**
//	 * Access tokens will not expire any earlier than this.
//	 */
//	private static final int MIN_ACCESS_TOKEN_VALIDITY_SECS = 60;
//
//	@Autowired
//	private DataSource dataSource;
//
//	public DataSource getDataSource() {
//		return dataSource;
//	}
//
//	public void setDataSource(DataSource dataSource) {
//		this.dataSource = dataSource;
//	}
//
//	private ApplicationContext applicationContext;
//
//	@Override
//	public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
//		this.applicationContext = applicationContext;
//	}
//
//	@EnableResourceServer
//	public static class ResourceServerConfiguration extends ResourceServerConfigurerAdapter {
//
//		private final TokenStore tokenStore;
//
//		private final CorsFilter corsFilter;
//
//		public ResourceServerConfiguration(TokenStore tokenStore, CorsFilter corsFilter) {
//			this.tokenStore = tokenStore;
//			this.corsFilter = corsFilter;
//		}
//
//		@Override
//		public void configure(HttpSecurity http) throws Exception {
//			http.exceptionHandling()
//					.authenticationEntryPoint((request, response, authException) -> response
//							.sendError(HttpServletResponse.SC_UNAUTHORIZED))
//					.and().csrf().disable().addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)
//					.headers().frameOptions().disable().and().sessionManagement()
//					.sessionCreationPolicy(SessionCreationPolicy.STATELESS).and().authorizeRequests()
//					.antMatchers("/api/**").permitAll();
//		}
//
//		@Override
//		public void configure(ResourceServerSecurityConfigurer resources) throws Exception {
//			resources.resourceId("jhipster-uaa").tokenStore(tokenStore);
//		}
//	}
//
//
//	@Override
//	public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
////		int accessTokenValidity = uaaProperties.getWebClientConfiguration().getAccessTokenValidityInSeconds();
////		accessTokenValidity = Math.max(accessTokenValidity, MIN_ACCESS_TOKEN_VALIDITY_SECS);
////		int refreshTokenValidity = uaaProperties.getWebClientConfiguration()
////				.getRefreshTokenValidityInSecondsForRememberMe();
////		refreshTokenValidity = Math.max(refreshTokenValidity, accessTokenValidity);
//		/*
//		 * For a better client design, this should be done by a ClientDetailsService
//		 * (similar to UserDetailsService).
//		 */
//		clients.jdbc(this.dataSource);
//
////		clients.inMemory().withClient(uaaProperties.getWebClientConfiguration().getClientId())
////				.secret(passwordEncoder.encode(uaaProperties.getWebClientConfiguration().getSecret())).scopes("openid")
////				.autoApprove(true).authorizedGrantTypes("implicit", "refresh_token", "password", "authorization_code")
////				.accessTokenValiditySeconds(accessTokenValidity).refreshTokenValiditySeconds(refreshTokenValidity).and()
////				.withClient(jHipsterProperties.getSecurity().getClientAuthorization().getClientId())
////				.secret(passwordEncoder
////						.encode(jHipsterProperties.getSecurity().getClientAuthorization().getClientSecret()))
////				.scopes("web-app").authorities("ROLE_ADMIN").autoApprove(true)
////				.authorizedGrantTypes("client_credentials")
////				.accessTokenValiditySeconds(
////						(int) jHipsterProperties.getSecurity().getAuthentication().getJwt().getTokenValidityInSeconds())
////				.refreshTokenValiditySeconds((int) jHipsterProperties.getSecurity().getAuthentication().getJwt()
////						.getTokenValidityInSecondsForRememberMe());
//	}
//
//	@Override
//	public void configure(AuthorizationServerSecurityConfigurer oauthServer) throws Exception {
//		// enpoint get token key :tokenKeyAccess /oauth/token_key
//		// enpoint check Token Access :checkTokenAccess /oauth/check_token
//		oauthServer.tokenKeyAccess("permitAll()").checkTokenAccess("isAuthenticated()");
//	}
//}
