import type { HttpCodeEntry, L10n, L10nList } from '../types';

const L = (en: string, es: string, pt: string): L10n => ({ en, es, pt });
const LL = (en: string[], es: string[], pt: string[]): L10nList => ({ en, es, pt });

/**
 * HTTP Status Codes reference tailored for SOC analysts, SIEM triage, and WAF log analysis.
 * Fully localized across English, Spanish, and Portuguese.
 */
export const HTTP_CODES: HttpCodeEntry[] = [
  {
    code: '200',
    name: 'OK',
    family: '2xx',
    risk: 'safe',
    meaning: L(
      'Standard successful HTTP request. The server processed the request and returned the requested payload.',
      'Solicitud HTTP exitosa estándar. El servidor procesó la petición y devolvió el contenido solicitado.',
      'Requisição HTTP bem-sucedida padrão. O servidor processou a solicitação e retornou o conteúdo requisitado.',
    ),
    attack: L(
      'A 200 OK does NOT mean harmless. Look for 200 responses on suspicious URLs (e.g., /admin, /wp-login.php, /actuator, .env, or webshell paths like /shell.aspx), unusually large response byte sizes indicating data exfiltration, or 200 OK returned on SQL injection probes indicating successful data extraction or authentication bypass.',
      'Un 200 OK NO significa inofensivo. Prestar atención a respuestas 200 en URLs sospechosas (p. ej., /admin, /wp-login.php, /actuator, .env, o webshells como /shell.aspx), tamaños de respuesta inusualmente grandes que indiquen exfiltración de datos, o 200 OK en pruebas de inyección SQL que sugieran bypass de autenticación exitoso.',
      'Um 200 OK NÃO significa inofensivo. Preste atenção em respostas 200 em URLs suspeitas (ex.: /admin, /wp-login.php, /actuator, .env ou caminhos de webshell como /shell.aspx), tamanhos de resposta anormalmente grandes indicando exfiltração de dados, ou 200 OK em testes de injeção SQL indicando bypass de autenticação.',
    ),
    action: LL(
      [
        'Inspect response payload size (Content-Length / bytes_sent) for outliers indicating data leaks',
        'Verify if sensitive endpoints (/api/keys, /actuator/env, /.git) legitimately return 200 to public IPs',
        'Correlate with WAF alert signatures to detect successful web application attacks',
      ],
      [
        'Inspeccionar el tamaño de la respuesta (Content-Length / bytes_sent) en busca de anomalías de exfiltración',
        'Verificar si endpoints sensibles (/api/keys, /actuator/env, /.git) devuelven 200 legítimamente a IPs públicas',
        'Correlacionar con firmas de alertas de WAF para detectar ataques web exitosos',
      ],
      [
        'Inspecionar o tamanho da resposta (Content-Length / bytes_sent) para identificar anomalias de exfiltração',
        'Verificar se endpoints sensíveis (/api/keys, /actuator/env, /.git) retornam legitimamente 200 para IPs públicos',
        'Correlacionar com assinaturas de alertas de WAF para detectar ataques bem-sucedidos a aplicações web',
      ],
    ),
  },
  {
    code: '301/302',
    name: 'Moved Permanently / Found (Redirects)',
    family: '3xx',
    risk: 'safe',
    meaning: L(
      'Redirection status codes. 301 is permanent redirect to a new URI; 302 is temporary redirect.',
      'Códigos de redirección. 301 es redirección permanente a una nueva URI; 302 es redirección temporal.',
      'Códigos de redirecionamento. 301 é redirecionamento permanente para uma nova URI; 302 é redirecionamento temporário.',
    ),
    attack: L(
      'Open Redirect vulnerabilities (CWE-601) abuse parameters like ?returnUrl= or ?next= to redirect users to phishing sites. Also seen in HTTP-to-HTTPS downgrade attacks (SSL stripping) or directory brute-forcing where missing trailing slashes trigger redirects.',
      'Vulnerabilidades de Open Redirect (CWE-601) abusan de parámetros como ?returnUrl= o ?next= para redirigir a sitios de phishing. También presentes en ataques de degradación SSL stripping o escaneos de directorios donde la falta de barra final provoca redirección.',
      'Vulnerabilidades de Open Redirect (CWE-601) abusam de parâmetros como ?returnUrl= ou ?next= para redirecionar a sites de phishing. Também observadas em ataques de SSL stripping ou varredura de diretórios onde a ausência da barra final gera redirecionamento.',
    ),
    action: LL(
      [
        'Check Location response header for external / untrusted domains in redirect targets',
        'Validate parameter sanitization on login, logout, and callback redirect flows',
        'Monitor for sudden spikes in redirects originating from unauthenticated sessions',
      ],
      [
        'Revisar la cabecera Location en busca de dominios externos o no confiables como destino',
        'Validar la sanitización de parámetros en flujos de login, logout y callbacks de redirección',
        'Monitorear picos repentinos de redirecciones originadas desde sesiones no autenticadas',
      ],
      [
        'Verificar o cabeçalho Location em busca de domínios externos ou não confiáveis como destino',
        'Validar a sanitização de parâmetros nos fluxos de login, logout e callbacks de redirecionamento',
        'Monitorar picos repentinos de redirecionamentos originados de sessões não autenticadas',
      ],
    ),
  },
  {
    code: '400',
    name: 'Bad Request',
    family: '4xx',
    risk: 'warning',
    meaning: L(
      'The server cannot process the request due to client error (malformed syntax, invalid framing, or deceptive request routing).',
      'El servidor no puede procesar la solicitud debido a un error del cliente (sintaxis malformada, encuadre inválido o enrutamiento engañoso).',
      'O servidor não pode processar a solicitação devido a erro do cliente (sintaxe malformada, enquadramento inválido ou roteamento enganoso).',
    ),
    attack: L(
      'Spikes in 400 often indicate automated vulnerability fuzzers sending malformed headers, HTTP Request Smuggling tests (mismatched Content-Length and Transfer-Encoding), oversized headers (cookie bombing), or invalid character sets in URL paths.',
      'Picos de 400 suelen indicar fuzzers de vulnerabilidades enviando cabeceras malformadas, pruebas de HTTP Request Smuggling (incoherencia Content-Length / Transfer-Encoding), cabeceras excesivas (cookie bombing) o caracteres inválidos en URLs.',
      'Picos de 400 costumam indicar fuzzers de vulnerabilidades enviando cabeçalhos malformados, testes de HTTP Request Smuggling (divergência Content-Length / Transfer-Encoding), cabeçalhos excessivos (cookie bombing) ou caracteres inválidos em URLs.',
    ),
    action: LL(
      [
        'Check raw URI and header fields for smuggling payloads and null bytes (%00)',
        'Investigate client IP reputation for automated scanning or botnet activity',
        'Verify if reverse proxy / CDN is rejecting requests before reaching origin',
      ],
      [
        'Revisar la URI y cabeceras en bruto en busca de payloads de smuggling y bytes nulos (%00)',
        'Investigar la reputación de la IP del cliente en busca de escaneos automáticos o botnets',
        'Verificar si el reverse proxy o CDN está rechazando solicitudes antes de llegar al origen',
      ],
      [
        'Verificar a URI e cabeçalhos brutos em busca de payloads de smuggling e bytes nulos (%00)',
        'Investigar a reputação do IP do cliente em busca de varreduras automatizadas ou botnets',
        'Verificar se o proxy reverso ou CDN está rejeitando solicitações antes de chegar à origem',
      ],
    ),
  },
  {
    code: '401',
    name: 'Unauthorized',
    family: '4xx',
    risk: 'critical',
    meaning: L(
      'Authentication is required and has failed or has not been provided. The WWW-Authenticate header specifies the challenge scheme.',
      'Se requiere autenticación y ha fallado o no ha sido proporcionada. La cabecera WWW-Authenticate especifica el esquema de desafío.',
      'A autenticação é necessária e falhou ou não foi fornecida. O cabeçalho WWW-Authenticate especifica o esquema de desafio.',
    ),
    attack: L(
      'High volumes of 401 on login endpoints (/api/v1/auth, /oauth/token, /login) indicate Credential Stuffing, brute-force attacks, or token expiration abuse. If followed by a single 200, it marks a successful account compromise.',
      'Altos volúmenes de 401 en endpoints de login (/api/v1/auth, /oauth/token, /login) indican Credential Stuffing, fuerza bruta o abuso de expiración de tokens. Si van seguidos de un único 200, señalan un compromiso de cuenta exitoso.',
      'Altos volumes de 401 em endpoints de login (/api/v1/auth, /oauth/token, /login) indicam Credential Stuffing, ataques de força bruta ou abuso de expiração de tokens. Se seguidos de um único 200, apontam para uma conta comprometida com sucesso.',
    ),
    action: LL(
      [
        'Group by Source IP and URI to detect distributed credential stuffing bursts',
        'Check for single IP hitting multiple usernames (spraying) vs. single username hit repeatedly (brute force)',
        'Enable WAF bot mitigations, CAPTCHA, or adaptive account lockout',
      ],
      [
        'Agrupar por IP de origen y URI para detectar ráfagas de credential stuffing distribuido',
        'Detectar si una IP prueba múltiples usuarios (spraying) o un solo usuario repetidamente (fuerza bruta)',
        'Activar mitigaciones de bots en el WAF, CAPTCHA o bloqueo adaptativo de cuentas',
      ],
      [
        'Agrupar por IP de origem e URI para detectar rajadas de credential stuffing distribuído',
        'Detectar se um IP testa múltiplos usuários (spraying) ou um único usuário repetidamente (força bruta)',
        'Ativar mitigações de bots no WAF, CAPTCHA ou bloqueio adaptativo de contas',
      ],
    ),
  },
  {
    code: '403',
    name: 'Forbidden',
    family: '4xx',
    risk: 'critical',
    meaning: L(
      'The server understands the request but refuses to authorize it. Unlike 401, authenticating will not grant access.',
      'El servidor entiende la solicitud pero se niega a autorizarla. A diferencia de 401, reautenticarse no otorgará acceso.',
      'O servidor compreende a solicitação, mas se recusa a autorizá-la. Diferente do 401, reautenticar não concederá acesso.',
    ),
    attack: L(
      'WAF block actions (Cloudflare, AWS WAF, ModSecurity) default to 403 when blocking malicious payloads (SQLi, XSS, RCE, Path Traversal). Also generated by Directory Traversal attempts, Forbidden file extensions (.htaccess, .env), or Broken Object Level Authorization (BOLA/IDOR) probes.',
      'Las acciones de bloqueo del WAF (Cloudflare, AWS WAF, ModSecurity) suelen devolver 403 al bloquear payloads maliciosos (SQLi, XSS, RCE, Path Traversal). También ocurre en intentos de Directory Traversal, archivos prohibidos (.htaccess, .env) o sondeos de BOLA/IDOR.',
      'As ações de bloqueio do WAF (Cloudflare, AWS WAF, ModSecurity) costumam retornar 403 ao bloquear payloads maliciosos (SQLi, XSS, RCE, Path Traversal). Também ocorre em tentativas de Directory Traversal, extensões proibidas (.htaccess, .env) ou sondagens de BOLA/IDOR.',
    ),
    action: LL(
      [
        'Inspect matched WAF rule ID or signature to identify the specific attack vector blocked',
        'Differentiate between WAF perimeter blocks vs. application-layer authorization failures (IDOR)',
        'If 403 is triggered by legitimate traffic, investigate false positives and tune WAF exceptions',
      ],
      [
        'Revisar la regla o firma de WAF activada para identificar el vector de ataque específico bloqueado',
        'Diferenciar entre bloqueos perimetrales del WAF y fallos de autorización a nivel de aplicación (IDOR)',
        'Si el 403 proviene de tráfico legítimo, investigar falsos positivos y ajustar excepciones del WAF',
      ],
      [
        'Verificar a regra ou assinatura de WAF ativada para identificar o vetor de ataque específico bloqueado',
        'Diferenciar bloqueios de perímetro do WAF de falhas de autorização na aplicação (IDOR)',
        'Se o 403 for gerado por tráfego legítimo, investigar falsos positivos e ajustar exceções no WAF',
      ],
    ),
  },
  {
    code: '404',
    name: 'Not Found',
    family: '4xx',
    risk: 'warning',
    meaning: L(
      'The server cannot find the requested resource. May be temporary or permanent.',
      'El servidor no puede encontrar el recurso solicitado. Puede ser temporal o permanente.',
      'O servidor não pode encontrar o recurso solicitado. Pode ser temporário ou permanente.',
    ),
    attack: L(
      'High-velocity 404 spikes from a single IP or user-agent strongly indicate content enumeration and fuzzing tools: Gobuster, Feroxbuster, Dirsearch, Nikto, or Nuclei looking for unlinked admin portals, backup files (.bak, .sql), git repositories (.git/HEAD), or forgotten endpoints.',
      'Picos veloces de 404 desde una sola IP o User-Agent indican fuertemente herramientas de enumeración y fuzzing: Gobuster, Feroxbuster, Dirsearch, Nikto o Nuclei buscando paneles de admin no enlazados, backups (.bak, .sql), repositorios git (.git/HEAD) o endpoints olvidados.',
      'Picos rápidos de 404 de um único IP ou User-Agent indicam fortemente ferramentas de enumeração e fuzzing: Gobuster, Feroxbuster, Dirsearch, Nikto ou Nuclei buscando painéis admin ocultos, backups (.bak, .sql), repositórios git (.git/HEAD) ou endpoints esquecidos.',
    ),
    action: LL(
      [
        'Alert when 404 error rate exceeds baseline threshold (>50 errors/min from a single IP)',
        'Extract targeted wordlists from request URIs to discern attacker intent (Wordpress, Spring, backup files)',
        'Ensure custom 404 error pages do not leak web server version, stack traces, or internal paths',
      ],
      [
        'Alertar cuando la tasa de 404 supere el umbral base (>50 errores/min desde una misma IP)',
        'Extraer los diccionarios usados a partir de las URIs para discernir el objetivo del atacante',
        'Garantizar que las páginas de error 404 personalizadas no filtren versiones de servidor o rutas internas',
      ],
      [
        'Alertar quando a taxa de 404 ultrapassar o limite base (>50 erros/min a partir de um único IP)',
        'Extraer as wordlists a partir das URIs requisitadas para identificar o objetivo do atacante',
        'Garantir que páginas de erro 404 customizadas não vazem versões de servidor ou caminhos internos',
      ],
    ),
  },
  {
    code: '405',
    name: 'Method Not Allowed',
    family: '4xx',
    risk: 'warning',
    meaning: L(
      'The request method (GET, POST, PUT, DELETE, OPTIONS, TRACE) is known by the server but not supported for the target resource.',
      'El método de solicitud (GET, POST, PUT, DELETE, OPTIONS, TRACE) es conocido por el servidor pero no está permitido para el recurso.',
      'O método da requisição (GET, POST, PUT, DELETE, OPTIONS, TRACE) é conhecido pelo servidor, mas não é permitido para o recurso.',
    ),
    attack: L(
      'Attackers probing APIs and endpoints with uncommon HTTP verbs (PUT, PATCH, DELETE, TRACE, DEBUG) attempting HTTP Verb Tampering, Bypassing Authentication filters configured only for GET/POST, or Cross-Site Tracing (XST).',
      'Atacantes probando APIs con verbos HTTP no convencionales (PUT, PATCH, DELETE, TRACE, DEBUG) intentando Verb Tampering, evadir filtros de autenticación configurados solo para GET/POST, o Cross-Site Tracing (XST).',
      'Atacantes testando APIs com verbos HTTP incomuns (PUT, PATCH, DELETE, TRACE, DEBUG) na tentativa de Verb Tampering, bypass de filtros configurados apenas para GET/POST, ou Cross-Site Tracing (XST).',
    ),
    action: LL(
      [
        'Disable dangerous HTTP methods globally at the web server (TRACE, TRACK, DEBUG)',
        'Verify whether authorization filters are applied uniformly across all HTTP verbs, not just GET/POST',
        'Inspect the Allow response header to confirm restricted method lists',
      ],
      [
        'Deshabilitar métodos HTTP peligrosos globalmente en el servidor web (TRACE, TRACK, DEBUG)',
        'Verificar si los filtros de autorización se aplican uniformemente a todos los verbos y no solo a GET/POST',
        'Inspeccionar la cabecera Allow de respuesta para confirmar listas de métodos restringidos',
      ],
      [
        'Desativar métodos HTTP perigosos globalmente no servidor web (TRACE, TRACK, DEBUG)',
        'Verificar se os filtros de autorização são aplicados a todos os verbos e não apenas a GET/POST',
        'Inspecionar o cabeçalho de resposta Allow para confirmar listas restritas de métodos',
      ],
    ),
  },
  {
    code: '413',
    name: 'Payload Too Large',
    family: '4xx',
    risk: 'critical',
    meaning: L(
      'The request entity is larger than limits defined by the server (e.g., client_max_body_size in Nginx or LimitRequestBody in Apache).',
      'La entidad de la petición es más grande que los límites definidos por el servidor (p. ej., client_max_body_size en Nginx).',
      'A entidade da requisição é maior do que os limites definidos pelo servidor (ex.: client_max_body_size no Nginx).',
    ),
    attack: L(
      'Seen during Application-layer Denial of Service (DoS) attacks, buffer overflow attempts, nested JSON/XML parser bombs (XML Entity Expansion / Billion Laughs), or oversized file upload exploits bypassing frontend size limits.',
      'Observado durante ataques de Denegación de Servicio (DoS) en capa de aplicación, intentos de desbordamiento de búfer, bombas de entidades XML (Billion Laughs) o subida de archivos gigantes evadiendo controles frontend.',
      'Observado durante ataques de Negação de Serviço (DoS) na camada de aplicação, tentativas de estouro de buffer, bombas XML (Billion Laughs) ou upload de arquivos gigantes burlador de controles no frontend.',
    ),
    action: LL(
      [
        'Check request URI and Content-Type to see if targeted endpoint is an upload handler or API endpoint',
        'Verify WAF body inspection limits (payloads exceeding WAF inspection size may bypass inspection)',
        'Enforce strict maximum payload sizes at reverse proxy per route',
      ],
      [
        'Revisar la URI y Content-Type para saber si el endpoint objetivo es un gestor de subidas o un endpoint de API',
        'Verificar los límites de inspección de cuerpo del WAF (payloads que excedan el límite pueden evadir el WAF)',
        'Imponer tamaños máximos de payload estrictos en el reverse proxy por cada ruta',
      ],
      [
        'Verificar a URI e o Content-Type para saber se o endpoint visado é um handler de upload ou endpoint de API',
        'Verificar os limites de inspeção de corpo do WAF (payloads que excedem o limite podem evadir o WAF)',
        'Impor tamanhos máximos de payload rigorosos no proxy reverso por rota',
      ],
    ),
  },
  {
    code: '422',
    name: 'Unprocessable Entity',
    family: '4xx',
    risk: 'warning',
    meaning: L(
      'The server understands the content type and syntax, but was unable to process the contained instructions (semantic validation error).',
      'El servidor comprende el tipo de contenido y la sintaxis, pero no pudo procesar las instrucciones contenidas (error de validación semántica).',
      'O servidor compreende o tipo de conteúdo e a sintaxe, mas não pôde processar as instruções contidas (erro de validação semântica).',
    ),
    attack: L(
      'Frequent in modern REST and GraphQL APIs when attackers fuzz input parameters, inject type-confusion payloads (sending arrays instead of strings), probe validation schemas for logic flaws, or trigger backend deserialization handlers.',
      'Frecuente en APIs REST y GraphQL cuando los atacantes realizan fuzzing de parámetros, inyectan type-confusion (enviar arrays en vez de strings), sondean esquemas de validación o buscan fallos lógicos en deserialización.',
      'Frequente em APIs REST e GraphQL quando atacantes realizam fuzzing de parâmetros, injetam type-confusion (enviando arrays em vez de strings), sondam esquemas de validação ou exploram falhas lógicas em desserialização.',
    ),
    action: LL(
      [
        'Inspect JSON/GraphQL payload body for schema fuzzing, unexpected fields, or deep object nesting',
        'Verify that validation error responses do not reflect unescaped user input (preventing stored/reflected XSS)',
        'Check if 422 errors precede 500 server crashes from unhandled parser exceptions',
      ],
      [
        'Inspeccionar el cuerpo JSON/GraphQL en busca de fuzzing de esquemas, campos inesperados o anidamiento excesivo',
        'Verificar que las respuestas de error de validación no reflejen datos de usuario sin escapar (evitando XSS)',
        'Comprobar si los errores 422 preceden caídas 500 provocadas por excepciones no controladas',
      ],
      [
        'Inspecionar o corpo JSON/GraphQL em busca de fuzzing de esquemas, campos inesperados ou aninhamento excessivo',
        'Verificar se as respostas de erro de validação não refletem entradas de usuário sem escape (evitando XSS)',
        'Checar se erros 422 antecedem falhas 500 causadas por exceções não tratadas',
      ],
    ),
  },
  {
    code: '429',
    name: 'Too Many Requests',
    family: '4xx',
    risk: 'warning',
    meaning: L(
      'The user has sent too many requests in a given amount of time (rate limiting). Often includes Retry-After header.',
      'El usuario ha enviado demasiadas solicitudes en un tiempo determinado (rate limiting). Suele incluir la cabecera Retry-After.',
      'O usuário enviou requisições demais em um determinado período de tempo (rate limiting). Costuma incluir o cabeçalho Retry-After.',
    ),
    attack: L(
      'Triggered when security rate limiters detect brute-force attacks, scraping, API quota exhaustion, or Layer 7 HTTP floods. A high count from rotating IP subnets indicates distributed botnet activity designed to stay just beneath single-IP thresholds.',
      'Se activa cuando limitadores de tasa detectan fuerza bruta, scraping masivo, agotamiento de cuotas de API o inundaciones HTTP L7. Un conteo elevado desde múltiples subredes indica actividad de botnets distribuidas.',
      'Disparado quando limitadores de taxa detectam ataques de força bruta, scraping em massa, esgotamento de cotas de API ou inundações HTTP L7. Contagem elevada de sub-redes rotativas indica atividade de botnet distribuída.',
    ),
    action: LL(
      [
        'Identify target endpoint: authentication, checkout, password reset, or public data API',
        'Evaluate whether rate limiting thresholds should trigger temporary IP blocks at WAF/perimeter',
        'Look for distributed patterns sharing same User-Agent, fingerprint (TLS JA3/JA4), or ASN',
      ],
      [
        'Identificar el endpoint objetivo: autenticación, checkout, reseteo de clave o API de datos públicos',
        'Evaluar si el umbral de rate limiting debe activar bloqueos temporales de IP en el WAF/perímetro',
        'Buscar patrones distribuidos que compartan el mismo User-Agent, huella TLS (JA3/JA4) o ASN',
      ],
      [
        'Identificar o endpoint alvo: autenticação, checkout, redefinição de senha ou API pública',
        'Avaliar se os limites de rate limiting devem disparar bloqueios temporários de IP no WAF/perímetro',
        'Buscar padrões distribuídos compartilhando o mesmo User-Agent, impressão digital TLS (JA3/JA4) ou ASN',
      ],
    ),
  },
  {
    code: '451',
    name: 'Unavailable For Legal Reasons',
    family: '4xx',
    risk: 'safe',
    meaning: L(
      'Access to the resource is blocked as a consequence of legal demands, court orders, copyright infringement (DMCA), or government censorship.',
      'El acceso al recurso está bloqueado debido a exigencias legales, órdenes judiciales, infracción de derechos de autor (DMCA) o censura.',
      'O acesso ao recurso está bloqueado devido a exigências legais, ordens judiciais, infração de direitos autorais (DMCA) ou censura.',
    ),
    attack: L(
      'Rarely an attack signal itself, but sudden appearance of 451 on your infrastructure can indicate court-ordered ISP blocking, DMCA takedown actions, or geo-blocking compliance triggers. Attackers may attempt circumvention via proxies/VPNs.',
      'Rara vez es un ataque directo, pero la aparición repentina de 451 en tu infraestructura puede indicar bloqueos judiciales de ISP, reclamos DMCA o cumplimiento de geobloqueos. Los atacantes intentarán evadirlo mediante proxies/VPN.',
      'Raramente é um sinal de ataque em si, mas o surgimento repentino de 451 na sua infraestrutura pode indicar bloqueios judiciais de ISP, notificações DMCA ou conformidade de geobloqueio. Atacantes tentarão burlar via proxies/VPN.',
    ),
    action: LL(
      [
        'Verify if 451 response was intentionally served by legal compliance configurations',
        'Examine response body for mandatory explanation of legal authority and jurisdiction',
        'Confirm that critical public services have not been accidentally misconfigured with 451 rules',
      ],
      [
        'Verificar si la respuesta 451 fue generada intencionalmente por políticas de cumplimiento legal',
        'Examinar el cuerpo de la respuesta en busca de la mención obligatoria de la autoridad legal o resolución',
        'Confirmar que servicios públicos críticos no hayan sido configurados por error con reglas 451',
      ],
      [
        'Verificar se a resposta 451 foi servida intencionalmente por políticas de conformidade legal',
        'Examinar o corpo da resposta em busca da menção obrigatória à autoridade legal e jurisdição',
        'Confirmar que serviços públicos críticos não foram configurados acidentalmente com regras 451',
      ],
    ),
  },
  {
    code: '500',
    name: 'Internal Server Error',
    family: '5xx',
    risk: 'critical',
    meaning: L(
      'The server encountered an unexpected condition that prevented it from fulfilling the request. Generic catch-all error.',
      'El servidor encontró una condición inesperada que le impidió completar la solicitud. Error genérico no controlado.',
      'O servidor encontrou uma condição inesperada que o impediu de atender à solicitação. Erro genérico não tratado.',
    ),
    attack: L(
      'CRITICAL INDICATOR: Spikes in 500 errors occurring on specific parameterized requests indicate successful exploitation attempts: SQL Injection triggering database syntax exceptions, Remote Code Execution causing process crashes, or XML/Deserialization bombs crashing application threads.',
      'INDICADOR CRÍTICO: Picos de errores 500 en peticiones con parámetros específicos indican intentos de explotación exitosos: inyección SQL provocando excepciones de sintaxis, RCE causando caída de procesos o deserialización no controlada.',
      'INDICADOR CRÍTICO: Picos de erros 500 em requisições parametrizadas específicas indicam tentativas bem-sucedidas de exploração: injeção SQL disparando exceções de sintaxe, RCE travando processos ou bombas de desserialização.',
    ),
    action: LL(
      [
        'Immediately correlate with application stack traces and error logs to extract unhandled exception details',
        'Inspect query parameters and POST body of the exact request that triggered the 500 error for SQLi or command injection strings',
        'Verify if database credentials, source code snippets, or environment variables were leaked in the error page',
      ],
      [
        'Correlacionar de inmediato con stack traces y logs de error de la aplicación para extraer la excepción no controlada',
        'Inspeccionar los parámetros y cuerpo POST de la petición que disparó el error 500 en busca de SQLi o inyección de comandos',
        'Verificar si se filtraron credenciales de base de datos, fragmentos de código o variables de entorno en la página de error',
      ],
      [
        'Correlacionar imediatamente com stack traces e logs de erro da aplicação para extrair a exceção não tratada',
        'Inspecionar parâmetros e corpo POST da requisição exata que disparou o 500 em busca de strings de SQLi ou injeção de comandos',
        'Verificar se credenciais de banco de dados, trechos de código ou variáveis de ambiente foram vazados na página de erro',
      ],
    ),
  },
  {
    code: '502',
    name: 'Bad Gateway',
    family: '5xx',
    risk: 'warning',
    meaning: L(
      'The server, while acting as a gateway or proxy, received an invalid response from the inbound upstream server.',
      'El servidor, actuando como gateway o proxy, recibió una respuesta no válida del servidor upstream.',
      'O servidor, agindo como gateway ou proxy, recebeu uma resposta inválida do servidor upstream.',
    ),
    attack: L(
      'Occurs when the upstream backend process crashes abruptly (OOM killer, segmentation fault from binary exploitation, PHP-FPM / Node.js worker termination) or drops TCP connections mid-handshake due to resource exhaustion under Denial of Service.',
      'Ocurre cuando el proceso backend upstream se cae abruptamente (OOM killer, segfault por exploit binario, caída de PHP-FPM/Node.js) o corta conexiones TCP por agotamiento de recursos bajo Denial of Service.',
      'Ocorre quando o processo de backend upstream trava abruptamente (OOM killer, falha de segmentação por exploit binário, encerramento de workers PHP-FPM/Node.js) ou encerra conexões TCP devido a esgotamento por DoS.',
    ),
    action: LL(
      [
        'Inspect upstream host metrics: CPU, memory (OOM killer invocation in dmesg), and process health',
        'Determine if specific malicious payloads caused core dumps or memory corruption in backend daemons',
        'Check network connectivity between reverse proxy (Nginx/HAProxy) and upstream application servers',
      ],
      [
        'Inspeccionar métricas del host upstream: CPU, memoria (OOM killer en dmesg) y salud de procesos',
        'Determinar si un payload malicioso específico provocó core dumps o corrupción de memoria en daemons del backend',
        'Verificar conectividad de red entre el reverse proxy (Nginx/HAProxy) y los servidores de aplicación',
      ],
      [
        'Inspecionar métricas do host upstream: CPU, memória (OOM killer no dmesg) e integridade dos processos',
        'Determinar se payloads maliciosos específicos causaram core dumps ou corrupção de memória em daemons',
        'Verificar conectividade de rede entre o proxy reverso (Nginx/HAProxy) e servidores de aplicação upstream',
      ],
    ),
  },
  {
    code: '503',
    name: 'Service Unavailable',
    family: '5xx',
    risk: 'critical',
    meaning: L(
      'The server is currently unable to handle the request due to temporary overloading or scheduled maintenance.',
      'El servidor no puede atender la solicitud actualmente debido a sobrecarga temporal o mantenimiento programado.',
      'O servidor não pode atender à solicitação no momento devido a sobrecarga temporária ou manutenção agendada.',
    ),
    attack: L(
      'HIGH PRIORITY IMPACT: Indicates successful Denial of Service (DoS/DDoS) exhausting connection pools, thread workers, database connections, or CPU. May also occur during aggressive vulnerability scans that overwhelm fragile legacy applications.',
      'IMPACTO DE ALTA PRIORIDAD: Indica una Denegación de Servicio (DoS/DDoS) exitosa que agotó pools de conexión, hilos de trabajo, conexiones de base de datos o CPU. También provocado por escaneos agresivos sobre apps frágiles.',
      'IMPACTO DE ALTA PRIORIDADE: Indica Negação de Serviço (DoS/DDoS) bem-sucedida esgotando pools de conexão, threads de execução, conexões de banco de dados ou CPU. Também decorre de varreduras agressivas sobre sistemas legados frágeis.',
    ),
    action: LL(
      [
        'Differentiate between planned maintenance downtime vs. active volumetric or Layer 7 DDoS attack',
        'Activate WAF emergency rate limiting, Geo-blocking, and Challenge mode (Under Attack Mode)',
        'Scale backend worker pools and verify database connection pool limits',
      ],
      [
        'Diferenciar entre mantenimiento programado y ataque activo de DDoS volumétrico o de Capa 7',
        'Activar rate limiting de emergencia en WAF, geobloqueos y modo desafío (Under Attack Mode)',
        'Escalar los pools de workers del backend y verificar los límites de conexiones de base de datos',
      ],
      [
        'Diferenciar entre manutenção programada e ataque ativo de DDoS volumétrico ou de Camada 7',
        'Ativar rate limiting de emergência no WAF, geobloqueio e modo desafio (Under Attack Mode)',
        'Escalar pools de workers do backend e verificar limites de conexões no banco de dados',
      ],
    ),
  },
  {
    code: '504',
    name: 'Gateway Timeout',
    family: '5xx',
    risk: 'warning',
    meaning: L(
      'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server or DNS.',
      'El servidor, actuando como gateway o proxy, no recibió respuesta a tiempo del servidor upstream o DNS.',
      'O servidor, agindo como gateway ou proxy, não recebeu uma resposta a tempo do servidor upstream ou DNS.',
    ),
    attack: L(
      'Characteristic of Slowloris / Slow HTTP POST attacks, algorithmic complexity attacks (ReDoS — Regular Expression Denial of Service), or Time-based Blind SQL Injection (where payloads intentionally inject SLEEP(10) or WAITFOR DELAY).',
      'Característico de ataques Slowloris / Slow HTTP POST, ataques de complejidad algorítmica (ReDoS — Expresiones Regulares catastróficas) o Inyección SQL Ciega basada en Tiempo (payloads con SLEEP(10) o WAITFOR DELAY).',
      'Típico de ataques Slowloris / Slow HTTP POST, ataques de complexidade algorítmica (ReDoS — Negação de Serviço por Expressão Regular) ou SQL Injection Cega baseada em Tempo (payloads com SLEEP(10) ou WAITFOR DELAY).',
    ),
    action: LL(
      [
        'Inspect query parameters for time delay injections (SLEEP, pg_sleep, DBMS_LOCK.SLEEP, WAITFOR DELAY)',
        'Check regex processing times in application handlers for ReDoS vulnerabilities',
        'Review proxy timeout thresholds and configure aggressive client request timeouts for Slowloris mitigation',
      ],
      [
        'Inspeccionar parámetros en busca de inyecciones de retardo temporal (SLEEP, pg_sleep, WAITFOR DELAY)',
        'Revisar tiempos de procesamiento de expresiones regulares en la aplicación por vulnerabilidades ReDoS',
        'Ajustar timeouts del proxy y configurar tiempos límite de petición estrictos contra Slowloris',
      ],
      [
        'Inspecionar parâmetros em busca de injeções de atraso de tempo (SLEEP, pg_sleep, WAITFOR DELAY)',
        'Revisar tempos de processamento de expressões regulares na aplicação para vulnerabilidades ReDoS',
        'Ajustar timeouts do proxy e configurar tempos limite de requisição agressivos para mitigar Slowloris',
      ],
    ),
  },
];
